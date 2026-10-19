process.env.NODE_ENV = 'test';
require('dotenv').config({ quiet: true });
process.env.DB_NAME = process.env.DB_NAME_TEST || 'healthcare_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { sequelize } = require('../src/models');

let server;
let base;

before(async () => {
  await sequelize.sync({ force: true }); // fresh tables
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await sequelize.close();
});

async function call(method, path, { token, body, raw } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(raw === undefined ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: raw !== undefined ? raw : body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

async function registerAndLogin(name, email) {
  await call('POST', '/auth/register', { body: { name, email, password: 'secret123' } });
  const { data } = await call('POST', '/auth/login', { body: { email, password: 'secret123' } });
  return data.token;
}

const patientBody = { name: 'Ravi Kumar', age: 34, gender: 'male', phone: '9999999999', medicalHistory: 'Asthma' };
const doctorBody = { name: 'Dr. Mehta', specialization: 'Cardiology', email: 'mehta@hospital.com', experienceYears: 12 };

let tokenA;
let tokenB;
let patientId;
let doctorId;
let mappingId;

test('Auth: register succeeds and never returns the password', async () => {
  const r = await call('POST', '/auth/register', { body: { name: 'Alice', email: 'alice@test.com', password: 'secret123' } });
  assert.equal(r.status, 201);
  assert.equal(r.data.data.email, 'alice@test.com');
  assert.equal(r.data.data.password, undefined);
});

test('Auth: duplicate email returns 409', async () => {
  const r = await call('POST', '/auth/register', { body: { name: 'Alice', email: 'alice@test.com', password: 'secret123' } });
  assert.equal(r.status, 409);
});

test('Auth: invalid register input returns 400 with field errors', async () => {
  const r = await call('POST', '/auth/register', { body: { name: '', email: 'bad', password: '1' } });
  assert.equal(r.status, 400);
  assert.equal(r.data.errors.length, 3);
});

test('Auth: wrong password returns 401, correct login returns a JWT', async () => {
  const bad = await call('POST', '/auth/login', { body: { email: 'alice@test.com', password: 'wrong' } });
  assert.equal(bad.status, 401);
  const ok = await call('POST', '/auth/login', { body: { email: 'alice@test.com', password: 'secret123' } });
  assert.equal(ok.status, 200);
  assert.ok(ok.data.token);
  tokenA = ok.data.token;
  tokenB = await registerAndLogin('Bob', 'bob@test.com');
});

test('Auth: malformed JSON body returns 400', async () => {
  const r = await call('POST', '/auth/login', { raw: '{"email": ' });
  assert.equal(r.status, 400);
});

test('Auth: missing or invalid token returns 401', async () => {
  assert.equal((await call('GET', '/patients')).status, 401);
  assert.equal((await call('GET', '/patients', { token: 'garbage' })).status, 401);
  assert.equal((await call('GET', '/doctors')).status, 401);
  assert.equal((await call('GET', '/mappings')).status, 401);
});

test('Patients: create, list, get', async () => {
  const created = await call('POST', '/patients', { token: tokenA, body: patientBody });
  assert.equal(created.status, 201);
  patientId = created.data.data.id;

  const list = await call('GET', '/patients', { token: tokenA });
  assert.equal(list.status, 200);
  assert.equal(list.data.count, 1);

  const one = await call('GET', `/patients/${patientId}`, { token: tokenA });
  assert.equal(one.status, 200);
  assert.equal(one.data.data.name, 'Ravi Kumar');
});

test('Patients: invalid input is rejected (age, gender, missing fields, phone)', async () => {
  const cases = [
    { name: 'X', age: -5, gender: 'male' },
    { name: 'X', age: 'abc', gender: 'male' },
    { name: 'X', age: 30, gender: 'robot' },
    { age: 30, gender: 'male' },
    { name: 'X', age: 30, gender: 'male', phone: 'abc' },
  ];
  for (const body of cases) {
    const r = await call('POST', '/patients', { token: tokenA, body });
    assert.equal(r.status, 400, JSON.stringify(body));
  }
});

test('Patients: User B cannot read, update, delete or list User A patients', async () => {
  assert.equal((await call('GET', `/patients/${patientId}`, { token: tokenB })).status, 404);
  assert.equal((await call('PUT', `/patients/${patientId}`, { token: tokenB, body: { age: 99 } })).status, 404);
  assert.equal((await call('DELETE', `/patients/${patientId}`, { token: tokenB })).status, 404);
  const list = await call('GET', '/patients', { token: tokenB });
  assert.equal(list.data.count, 0);
  // and A's record is untouched
  const still = await call('GET', `/patients/${patientId}`, { token: tokenA });
  assert.equal(still.data.data.age, 34);
});

test('Patients: update works, validates all fields, rejects empty body', async () => {
  const ok = await call('PUT', `/patients/${patientId}`, { token: tokenA, body: { age: 35, address: 'Agra' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.data.age, 35);
  assert.equal(ok.data.data.address, 'Agra');

  assert.equal((await call('PUT', `/patients/${patientId}`, { token: tokenA, body: {} })).status, 400);
  assert.equal((await call('PUT', `/patients/${patientId}`, { token: tokenA, body: { unknownField: 1 } })).status, 400);
  assert.equal((await call('PUT', `/patients/${patientId}`, { token: tokenA, body: { phone: 'abc' } })).status, 400);
  assert.equal((await call('PUT', `/patients/${patientId}`, { token: tokenA, body: { address: 123 } })).status, 400);
  assert.equal((await call('PUT', `/patients/${patientId}`, { token: tokenA, body: { age: 200 } })).status, 400);
});

test('Patients: nonexistent id returns 404, non-numeric id returns 400', async () => {
  assert.equal((await call('GET', '/patients/99999', { token: tokenA })).status, 404);
  assert.equal((await call('PUT', '/patients/99999', { token: tokenA, body: { age: 20 } })).status, 404);
  assert.equal((await call('DELETE', '/patients/99999', { token: tokenA })).status, 404);
  assert.equal((await call('GET', '/patients/abc', { token: tokenA })).status, 400);
});

test('Doctors: create, duplicate email 409, validation 400', async () => {
  const created = await call('POST', '/doctors', { token: tokenA, body: doctorBody });
  assert.equal(created.status, 201);
  doctorId = created.data.data.id;

  assert.equal((await call('POST', '/doctors', { token: tokenA, body: doctorBody })).status, 409);
  assert.equal((await call('POST', '/doctors', { token: tokenA, body: { name: 'D', specialization: 'X', email: 'nope' } })).status, 400);
  assert.equal((await call('POST', '/doctors', { token: tokenA, body: { name: 'D', email: 'd@x.com' } })).status, 400);
  assert.equal((await call('POST', '/doctors', { token: tokenA, body: { ...doctorBody, email: 'e@x.com', phone: 'abc' } })).status, 400);
  assert.equal((await call('POST', '/doctors', { token: tokenA, body: { ...doctorBody, email: 'f@x.com', experienceYears: -1 } })).status, 400);
});

test('Doctors: any user can list/get; only the creator can update or delete', async () => {
  const list = await call('GET', '/doctors', { token: tokenB });
  assert.equal(list.status, 200);
  assert.equal(list.data.count, 1);
  assert.equal((await call('GET', `/doctors/${doctorId}`, { token: tokenB })).status, 200);

  assert.equal((await call('PUT', `/doctors/${doctorId}`, { token: tokenB, body: { name: 'Hacked' } })).status, 403);
  assert.equal((await call('DELETE', `/doctors/${doctorId}`, { token: tokenB })).status, 403);

  const ok = await call('PUT', `/doctors/${doctorId}`, { token: tokenA, body: { experienceYears: 13 } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.data.experienceYears, 13);
});

test('Doctors: empty update body 400, invalid phone 400, missing id 404', async () => {
  assert.equal((await call('PUT', `/doctors/${doctorId}`, { token: tokenA, body: {} })).status, 400);
  assert.equal((await call('PUT', `/doctors/${doctorId}`, { token: tokenA, body: { phone: 'abc' } })).status, 400);
  assert.equal((await call('GET', '/doctors/99999', { token: tokenA })).status, 404);
  assert.equal((await call('PUT', '/doctors/99999', { token: tokenA, body: { name: 'X' } })).status, 404);
  assert.equal((await call('DELETE', '/doctors/99999', { token: tokenA })).status, 404);
});

test('Mappings: assign a doctor to a patient', async () => {
  const r = await call('POST', '/mappings', { token: tokenA, body: { patientId, doctorId } });
  assert.equal(r.status, 201);
  mappingId = r.data.data.id;
});

test('Mappings: assigning the same doctor twice is rejected (409)', async () => {
  const r = await call('POST', '/mappings', { token: tokenA, body: { patientId, doctorId } });
  assert.equal(r.status, 409);
});

test('Mappings: invalid or unknown ids are rejected', async () => {
  assert.equal((await call('POST', '/mappings', { token: tokenA, body: { patientId, doctorId: 99999 } })).status, 404);
  assert.equal((await call('POST', '/mappings', { token: tokenA, body: { patientId: 99999, doctorId } })).status, 404);
  assert.equal((await call('POST', '/mappings', { token: tokenA, body: { patientId: 'x' } })).status, 400);
  // User B cannot assign doctors to User A's patient
  assert.equal((await call('POST', '/mappings', { token: tokenB, body: { patientId, doctorId } })).status, 404);
});

test('Mappings: list and per-patient lookup (and privacy between users)', async () => {
  const list = await call('GET', '/mappings', { token: tokenA });
  assert.equal(list.status, 200);
  assert.equal(list.data.count, 1);

  const byPatient = await call('GET', `/mappings/${patientId}`, { token: tokenA });
  assert.equal(byPatient.status, 200);
  assert.equal(byPatient.data.data[0].doctor.name, 'Dr. Mehta');

  assert.equal((await call('GET', '/mappings', { token: tokenB })).data.count, 0);
  assert.equal((await call('GET', `/mappings/${patientId}`, { token: tokenB })).status, 404);
  assert.equal((await call('GET', '/mappings/99999', { token: tokenA })).status, 404);
});

test('Mappings: User B cannot delete User A mapping; A can', async () => {
  assert.equal((await call('DELETE', `/mappings/${mappingId}`, { token: tokenB })).status, 404);
  assert.equal((await call('DELETE', `/mappings/${mappingId}`, { token: tokenA })).status, 200);
  assert.equal((await call('DELETE', `/mappings/${mappingId}`, { token: tokenA })).status, 404);
});

test('Deleting a patient removes its mappings (cascade)', async () => {
  await call('POST', '/mappings', { token: tokenA, body: { patientId, doctorId } });
  assert.equal((await call('DELETE', `/patients/${patientId}`, { token: tokenA })).status, 200);
  assert.equal((await call('GET', `/patients/${patientId}`, { token: tokenA })).status, 404);
  assert.equal((await call('GET', '/mappings', { token: tokenA })).data.count, 0);
});

test('Doctor delete works for the creator; unknown routes return 404 JSON', async () => {
  assert.equal((await call('DELETE', `/doctors/${doctorId}`, { token: tokenA })).status, 200);
  assert.equal((await call('GET', `/doctors/${doctorId}`, { token: tokenA })).status, 404);
  assert.equal((await call('GET', '/nope')).status, 404);
});

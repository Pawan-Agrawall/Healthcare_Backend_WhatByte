# Healthcare Backend API

Backend for a healthcare application, built for the WhatBytes Full Stack Intern assignment. Users can register and log in, manage patients and doctors, and assign doctors to patients.

**Tech stack:** Node.js, Express, PostgreSQL, Sequelize (ORM), JWT (`jsonwebtoken`), `bcryptjs`, `express-validator`.

> The assignment mentions Django, but the role allows Django or Node. This project uses Node.js with the same requirements: REST APIs, PostgreSQL, ORM-based modelling, JWT authentication, validation, error handling, and environment variables.

## Prerequisites

- Node.js 18 or newer
- PostgreSQL 13 or newer, running locally

## Setup and run

### 1. Create two databases

One database is for the app and one is for the automated tests.

Using `psql` (if it is on your PATH):

```bash
psql -U postgres -c "CREATE DATABASE healthcare_db;"
psql -U postgres -c "CREATE DATABASE healthcare_test;"
```

Or create `healthcare_db` and `healthcare_test` in pgAdmin (right-click Databases, then Create, then Database).

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and edit it.

```bash
# macOS / Linux
cp .env.example .env

# Windows (Command Prompt or PowerShell)
copy .env.example .env
```

Open `.env` and set `DB_USER`, `DB_PASSWORD`, and a long random `JWT_SECRET`. The `.env` file is ignored by git and must never be committed.

### 4. Start the server

```bash
npm start
```

The API runs at `http://localhost:5000`. Tables are created automatically on startup. Use `npm run dev` for auto-reload during development.

## Environment variables

| Variable | Purpose |
|----------|---------|
| PORT | Server port (default 5000) |
| DB_HOST, DB_PORT | PostgreSQL host and port |
| DB_NAME | Database used by the app (for example `healthcare_db`) |
| DB_USER, DB_PASSWORD | PostgreSQL credentials |
| DB_NAME_TEST | Separate database used by `npm test` (it is wiped on every test run) |
| JWT_SECRET | Secret used to sign tokens |
| JWT_EXPIRES_IN | Token lifetime, for example `1d` |

## Project structure

```
src/
  config/db.js        Sequelize connection
  models/             User, Patient, Doctor, Mapping and their associations (index.js)
  middleware/         auth (JWT check), validate, errorHandler
  controllers/        business logic
  routes/             endpoints and validation rules
  app.js, server.js   Express app and startup
tests/api.test.js     integration tests (real PostgreSQL)
postman_collection.json
```

## Database relationships

- **User to Patient** (one-to-many): `patients.createdBy` references the user who created the patient.
- **User to Doctor** (one-to-many): `doctors.createdBy` references the user who added the doctor.
- **Patient and Doctor** (many-to-many) through the `mappings` table (`patientId`, `doctorId`). A unique index on the pair prevents assigning the same doctor to the same patient twice.
- Deleting a patient or a doctor also deletes its mappings (`ON DELETE CASCADE`).

## API reference

Protected routes need the header `Authorization: Bearer <token>`. Get the token from the login endpoint.

| Method | Endpoint | Description | Success | Common errors |
|--------|----------|-------------|---------|---------------|
| POST | /api/auth/register | Register (name, email, password) | 201 | 400 invalid input, 409 email exists |
| POST | /api/auth/login | Log in, returns `token` | 200 | 400 invalid input, 401 wrong credentials |
| POST | /api/patients | Add a patient | 201 | 400, 401 |
| GET | /api/patients | Patients created by the logged-in user | 200 | 401 |
| GET | /api/patients/:id | One patient (own only) | 200 | 400 bad id, 401, 404 |
| PUT | /api/patients/:id | Update a patient (own only) | 200 | 400 (invalid or empty body), 401, 404 |
| DELETE | /api/patients/:id | Delete a patient (own only) | 200 | 401, 404 |
| POST | /api/doctors | Add a doctor | 201 | 400, 401, 409 email exists |
| GET | /api/doctors | List all doctors | 200 | 401 |
| GET | /api/doctors/:id | One doctor | 200 | 400, 401, 404 |
| PUT | /api/doctors/:id | Update a doctor (creator only) | 200 | 400, 401, 403, 404, 409 |
| DELETE | /api/doctors/:id | Delete a doctor (creator only) | 200 | 401, 403, 404 |
| POST | /api/mappings | Assign a doctor to a patient (`patientId`, `doctorId`) | 201 | 400, 401, 404, 409 already assigned |
| GET | /api/mappings | Mappings of the logged-in user's patients | 200 | 401 |
| GET | /api/mappings/:patient_id | Doctors assigned to a patient | 200 | 400, 401, 404 |
| DELETE | /api/mappings/:id | Remove a doctor from a patient | 200 | 401, 404 |

Error responses use one format: `{ "success": false, "message": "...", "errors": [...] }`.

### Sample request bodies

```json
// POST /api/auth/register
{ "name": "Love", "email": "love@example.com", "password": "secret123" }

// POST /api/auth/login
{ "email": "love@example.com", "password": "secret123" }

// POST /api/patients
{ "name": "Ravi Kumar", "age": 34, "gender": "male", "phone": "9999999999", "medicalHistory": "Asthma" }

// POST /api/doctors
{ "name": "Dr. Mehta", "specialization": "Cardiology", "email": "mehta@hospital.com", "experienceYears": 12 }

// POST /api/mappings
{ "patientId": 1, "doctorId": 1 }
```

## Design decisions

- **Passwords** are hashed with bcrypt and never returned in responses.
- **Patients are private.** A user can only see and change patients they created. Other users get 404, so a patient's existence is not revealed.
- **Doctors are shared.** Any logged-in user can view all doctors (the assignment says "retrieve all doctors"), but only the creator can edit or delete a doctor.
- **GET /api/mappings** returns mappings for the logged-in user's own patients, so one user cannot see another user's patient data.
- **Validation** runs on every input field, including optional ones. An update request with no updatable field is rejected with 400.
- **Unknown body fields are ignored.** Only whitelisted fields are saved, so users cannot set `id` or `createdBy` themselves.
- Tables are created with `sequelize.sync()` on startup to keep setup simple.

## Possible improvements

- Use database migrations instead of `sequelize.sync()`.
- Add pagination and search/filtering on list endpoints.
- Add refresh tokens and rate limiting on the login endpoint.
- Add role-based access (for example admin users who can manage all doctors).

## Testing

Automated integration tests run against a real PostgreSQL test database (`DB_NAME_TEST`). The test database is wiped at the start of every run, so never point it at data you want to keep.

```bash
npm test
```

The tests cover:

- Register and login, duplicate email (409), wrong password (401)
- Requests without a valid token (401)
- Cross-user access: user B cannot read, update, delete, or list user A's patients, and cannot modify user A's doctors or mappings
- Missing records (404) and invalid ids (400)
- Invalid input (bad age, gender, phone, missing fields), empty update bodies, and malformed JSON (400)
- Assigning the same doctor to the same patient twice (409)
- Cascade deletion of mappings when a patient is deleted

**Last run: 21 tests, 21 passed, 0 failed.**

### Manual testing with Postman

Import `postman_collection.json` into Postman. Run **Register**, then **Login** (the token is saved automatically into the collection variable), then try the patient, doctor, and mapping requests.
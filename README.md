# Healthcare Backend API

Built as part of the **WhatBytes Full Stack Intern Assignment**.

A backend project that provides REST APIs for user authentication, patient management, doctor management, and assigning doctors to patients.

The application is built using **Node.js, Express.js, PostgreSQL, and Sequelize**, with support for JWT authentication, password hashing, input validation, error handling, and automated integration testing.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Authentication:** JWT (`jsonwebtoken`)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **Testing:** Jest, Supertest, PostgreSQL
- **API Testing:** Postman


---

## Features

- User registration and login with JWT authentication
- Secure password storage using bcrypt
- Create, view, update, and delete patients
- Add, view, update, and delete doctors
- Assign doctors to patients and remove assignments
- Input validation for API requests
- Protected routes using JWT middleware
- Ownership-based access control
- PostgreSQL relationships managed through Sequelize
- Consistent error handling and API responses
- Automated API integration tests

---

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js 18+
- PostgreSQL 13+
- npm
- Postman (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/Pawan-Agrawall/Healthcare_Backend_WhatByte.git
cd Healthcare_Backend_WhatByte
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create PostgreSQL Databases

Create two databases:

```sql
CREATE DATABASE healthcare_db;
CREATE DATABASE healthcare_test;
```

### 4. Configure Environment Variables

Copy the example file:

```bash
# Windows
copy .env.example .env
```

Update `.env` with your PostgreSQL credentials:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

DB_NAME_TEST=healthcare_test

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1d
```

### 5. Start the Server

Production:

```bash
npm start
```

Development:

```bash
npm run dev
```

The API will run on:

```text
http://localhost:5000
```

Database tables are automatically created on application startup.

---

## API Authentication

All protected endpoints require a JWT token:

```http
Authorization: Bearer <your_token>
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login and receive JWT |

### Patients

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | `/api/patients` | Create a patient |
| GET | `/api/patients` | Get all patients of logged-in user |
| GET | `/api/patients/:id` | Get patient details |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient |

### Doctors

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | `/api/doctors` | Add doctor |
| GET | `/api/doctors` | Get all doctors |
| GET | `/api/doctors/:id` | Get doctor details |
| PUT | `/api/doctors/:id` | Update doctor |
| DELETE | `/api/doctors/:id` | Delete doctor |

### Patient-Doctor Mappings

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | `/api/mappings` | Assign doctor to patient |
| GET | `/api/mappings` | Get mappings for logged-in user's patients |
| GET | `/api/mappings/:patient_id` | Get doctors assigned to patient |

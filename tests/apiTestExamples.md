# SphereTest API – cURL Examples

Base URL: `http://localhost:5000`

## Prerequisites

1. Make sure MongoDB is running locally.
2. In the `backend` folder, seed sample data (optional but recommended):
   ```bash
   node seedData.js
   ```
3. Start the API server:
   ```bash
   node src/server.js
   ```

You can then use the following `curl` commands to exercise all endpoints.

**Note:** For protected routes, you'll need to first register/login to get a JWT token, then include it in the Authorization header:
```bash
-H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## Authentication

### Register User – `POST /api/auth/register`

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "admin"
  }'
```

**Response:** Returns user object with JWT token.

### Login User – `POST /api/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@spheretest.com",
    "password": "admin123"
  }'
```

**Response:** Returns user object with JWT token. Save the token for protected routes.

### Get Current User – `GET /api/auth/me`

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## Users

### Get All Users – `GET /api/users`

```bash
curl http://localhost:5000/api/users
```

---

## Spheres

### Create Sphere – `POST /api/spheres`

**Requires Authentication**

```bash
curl -X POST http://localhost:5000/api/spheres \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "title": "Sample Sphere",
    "description": "Demo sphere for testing",
    "type": "mcq",
    "duration": 60,
    "maxPlayers": 50,
    "difficulty": "medium",
    "security": {
      "faceId": true,
      "fullscreen": false,
      "tabSwitchDetection": true
    }
  }'
```

**Response:** Returns sphere object with auto-generated `gameCode`.

### Get All Spheres – `GET /api/spheres`

```bash
curl http://localhost:5000/api/spheres
```

### Get Sphere by ID – `GET /api/spheres/:id`

```bash
curl http://localhost:5000/api/spheres/<SPHERE_ID>
```

### Get Sphere by Game Code – `GET /api/spheres/code/:code`

```bash
curl http://localhost:5000/api/spheres/code/ABC123
```

### Join Sphere – `POST /api/spheres/join`

**Requires Authentication**

```bash
curl -X POST http://localhost:5000/api/spheres/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "gameCode": "ABC123"
  }'
```

### Delete Sphere – `DELETE /api/spheres/:id`

**Requires Authentication (Creator only)**

```bash
curl -X DELETE http://localhost:5000/api/spheres/<SPHERE_ID> \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## Questions

### Create MCQ Question – `POST /api/questions`

**Requires Authentication**

```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "sphereId": "<SPHERE_ID>",
    "type": "MCQ",
    "questionText": "What is 2 + 2?",
    "options": ["1", "2", "3", "4"],
    "correctAnswer": "4"
  }'
```

### Create CODE Question – `POST /api/questions`

**Requires Authentication**

```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "sphereId": "<SPHERE_ID>",
    "type": "CODE",
    "questionText": "Write a function that returns the sum of two numbers",
    "codeLanguage": "javascript",
    "starterCode": "function add(a, b) {\n  // Write your code here\n}",
    "correctAnswer": "function add(a, b) { return a + b; }"
  }'
```

### Create TEXT Question – `POST /api/questions`

**Requires Authentication**

```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "sphereId": "<SPHERE_ID>",
    "type": "TEXT",
    "questionText": "Explain what is JavaScript?",
    "correctAnswer": "JavaScript is a programming language used for web development"
  }'
```

### Create BOOL Question – `POST /api/questions`

**Requires Authentication**

```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "sphereId": "<SPHERE_ID>",
    "type": "BOOL",
    "questionText": "JavaScript is a compiled language.",
    "correctAnswer": false
  }'
```

### Get Questions for a Sphere – `GET /api/questions/:sphereId`

```bash
curl http://localhost:5000/api/questions/<SPHERE_ID>
```

### Update Question – `PUT /api/questions/:id`

**Requires Authentication**

```bash
curl -X PUT http://localhost:5000/api/questions/<QUESTION_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "questionText": "Updated question text"
  }'
```

### Delete Question – `DELETE /api/questions/:id`

**Requires Authentication**

```bash
curl -X DELETE http://localhost:5000/api/questions/<QUESTION_ID> \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## Complete Workflow Example

1. **Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123", "role": "admin"}'
```

2. **Save the token from the response, then create a sphere:**
```bash
curl -X POST http://localhost:5000/api/spheres \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_FROM_STEP_1>" \
  -d '{"title": "My Test Sphere", "type": "mcq", "duration": 30}'
```

3. **Save the sphere ID and gameCode from the response, then create questions:**
```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_FROM_STEP_1>" \
  -d '{"sphereId": "<SPHERE_ID>", "type": "MCQ", "questionText": "Test question?", "options": ["A", "B", "C"], "correctAnswer": "A"}'
```

4. **Get all questions for the sphere:**
```bash
curl http://localhost:5000/api/questions/<SPHERE_ID>
```

---

## Health Check

### Health Check – `GET /`

```bash
curl http://localhost:5000/
```

**Response:** `SphereTest API Running`

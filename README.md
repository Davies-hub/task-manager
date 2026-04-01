# Laravel Task Manager API

A RESTful Task Management API built with Laravel 13 and MySQL.

---

## Requirements

- PHP 8.3+
- Composer
- MySQL 8.0+

---

## How to Run Locally

1. **Clone the repository**
   git clone <your-repo-url>
   cd laravel

2. **Install dependencies**
   composer install

3. **Set up environment**
   cp .env.example .env

    # On Windows PowerShell/CMD, use: copy .env.example .env

    Open `.env` and update the database section:
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=task_manager
    DB_USERNAME=root
    DB_PASSWORD=your_password

4. **Generate app key**
   php artisan key:generate

5. **Run migrations**
   php artisan migrate

6. **Start the server**
   php artisan serve

    Web app is now available at: http://127.0.0.1:8000
    API is now available at: http://127.0.0.1:8000/api

---

## Web App

The frontend is served from `public/index.html` and communicates with the Laravel API using relative `/api` requests. Open the root URL in your browser to access the task manager UI.

---

## API Endpoints

### 1. Create Task

- **POST** `/api/tasks`
- Body:

```json
{
    "title": "Fix login bug",
    "due_date": "2026-04-10",
    "priority": "high"
}
```

- Rules: title must be unique for a given due_date, due_date must be today or later

### 2. List Tasks

- **GET** `/api/tasks`
- Optional filter: `/api/tasks?status=pending`
- Sorted by priority (high → medium → low), then due_date ascending

### 3. Update Task Status

- **PATCH** `/api/tasks/{id}/status`
- Body:

```json
{
    "status": "in_progress"
}
```

- Status progression is restricted: pending → in_progress → done

### 4. Delete Task

- **DELETE** `/api/tasks/{id}`
- Only tasks with status `done` can be deleted

### 5. Daily Report

- **GET** `/api/tasks/report?date=2026-04-05`
- Returns task counts grouped by priority and status for the requested due date

---

## Deployment

This repository currently does not include a public deployment URL.

If you want to deploy it, a common pattern is:

1. Push the repository to GitHub
2. Create a new project on a deployment platform (Railway, Heroku, etc.)
3. Add a MySQL database service
4. Set the same database environment variables in the platform settings
5. Use a web start command like:
   `php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT`

---

## Database

MySQL is used. A migration file is included at:
`database/migrations/2026_03_31_164840_create_tasks_table.php`

To reset the database:

```bash
php artisan migrate:fresh
```

---

## Notes

- All requests should include `Accept: application/json` and `Content-Type: application/json`
- The API returns JSON responses for both success and error conditions
- If using Postman, make sure the request body is raw JSON and the route is prefixed with `/api`

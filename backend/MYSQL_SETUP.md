# MySQL Database Setup Instructions

To run the application with MySQL as requested, please follow these steps:

## 1. Start MySQL Server
Ensure your local MySQL server is running. You can usually start it via:
- **System Settings** (on macOS/Windows)
- Command line: `brew services start mysql` (if installed via Homebrew) or `sudo service mysql start` (Linux).

## 2. Create the Database
Login to your MySQL console and create the database:
```sql
CREATE DATABASE learning_diag;
```

## 3. Configure Environment Variables
Update the `.env` file in `student-app/backend/` with your MySQL credentials:
```env
DATABASE_URL=mysql+pymysql://<USER>:<PASSWORD>@localhost:3306/learning_diag
SECRET_KEY=your_secret_key_here
```

## 4. Troubleshooting
If you receive `Connection refused`, it means the MySQL server is either not running or listening on a different port.

> [!TIP]
> If you want to continue testing without MySQL right now, I can switch the `DATABASE_URL` in `.env` to a local SQLite file (e.g., `sqlite:///./test.db`), but the application is currently optimized for MySQL as requested.


# 🛠️ Running Portals Pro Backend Locally

This guide explains how to run the backend logic on your local machine using the `local_server.js` wrapper.

## 1. Prerequisites
- **Node.js**: Installed on your machine.
- **PostgreSQL**: A running database (Local or Cloud like Supabase/RDS).
- **Dependencies**: You need `express`, `cors`, and `pg`.

## 2. Install Dependencies
Run the following in your project root:
```bash
npm install express cors pg
```

## 3. Database Setup
Execute the table creation scripts mentioned in `backend/API_DOCS.md` in your PostgreSQL instance.

## 4. Configure Environment Variables
You must set the following environment variables in your terminal before starting the server so the code can connect to your DB:

**Windows (Command Prompt):**
```cmd
set DB_HOST=your-db-host
set DB_USER=your-db-user
set DB_PASSWORD=your-db-password
set DB_NAME=your-db-name
```

**Mac/Linux (Terminal):**
```bash
export DB_HOST=your-db-host
export DB_USER=your-db-user
export DB_PASSWORD=your-db-password
export DB_NAME=your-db-name
```

## 5. Start the Local Server
Run the local server wrapper:
```bash
node local_server.js
```
The server will start at `http://localhost:3001`.

## 6. Connect the Frontend
To tell the React app to talk to your local server instead of using mock data:

1. Open `services/api.ts`.
2. Update the `API_BASE_URL` or ensure `(window as any).CONFIG_API_URL` is set.
3. Alternatively, for a quick test, hardcode:
   ```typescript
   const API_BASE_URL = 'http://localhost:3001';
   ```

## 7. Development Workflow
1. **Frontend**: Run your React dev server (usually `npm run dev` or similar).
2. **Backend**: Run `node local_server.js` in a separate terminal.
3. **Database**: Watch your PostgreSQL tables populate as you perform actions in the UI!

---

### Why use a wrapper?
By using `local_server.js`, you are running the **exact same code** that will eventually go into AWS Lambda. This ensures that if it works on your machine, it will work in the cloud.

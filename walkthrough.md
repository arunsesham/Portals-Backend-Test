
# 🚀 Portals Pro: Full-Stack Walkthrough

Follow these steps to get the **Frontend** and **Backend** running together on your local machine.

---

## 1. Database Setup (Aiven PostgreSQL)
The credentials are already configured in `backend/db.js`.

### Execute this SQL to create your tables:
Connect to your Aiven database and run the following script:

```sql
-- 1. Employees Table
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'Admin', 'Manager', 'Employee', 'HR', 'Lead'
    department VARCHAR(100),
    position VARCHAR(100),
    location VARCHAR(100),
    avatar_url TEXT DEFAULT 'https://placehold.co/200x200/000000/FFFFFF/png?text=User',
    leaves_remaining INT DEFAULT 20,
    leaderboard_points INT DEFAULT 0,
    manager_id INT REFERENCES employees(employee_id),
    join_date DATE DEFAULT CURRENT_DATE,
    dob DATE,
    phone VARCHAR(20),
    subsidiary VARCHAR(100)
);

-- 2. Announcements
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    type VARCHAR(50), -- e.g., 'IT UPDATE', 'CORPORATE'
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Company Policies
CREATE TABLE policies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    icon VARCHAR(50), -- icon name
    color VARCHAR(50), -- tailwind color class
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Attendance
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id),
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(50), -- 'Present', 'Absent', 'Late'
    UNIQUE(employee_id, date)
);

-- 5. Leaves
CREATE TABLE leaves (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(50), -- 'Sick', 'Vacation', 'Casual', 'Comp-Off'
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    reason TEXT,
    supervisor_comment TEXT
);

-- 6. Job Postings
CREATE TABLE job_postings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    department VARCHAR(100),
    description TEXT,
    type VARCHAR(50), -- 'Full-time', 'Contract'
    url TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    referral_bonus VARCHAR(50) DEFAULT '$0'
);

-- 7. Referrals
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    candidate_name VARCHAR(255),
    email VARCHAR(255),
    job_id INT REFERENCES job_postings(id),
    referred_by INT REFERENCES employees(employee_id),
    resume_url TEXT,
    status VARCHAR(50) DEFAULT 'Applied',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Helpdesk Tickets
CREATE TABLE helpdesk_tickets (
    ticket_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id),
    subject VARCHAR(255),
    category VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Open',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Holidays
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    date DATE NOT NULL,
    type VARCHAR(50), -- 'Public', 'Optional'
    locations TEXT[] -- Array of locations like ['India', 'US']
);

-- 10. System Configuration
CREATE TABLE system_config (
    account_id VARCHAR(50) PRIMARY KEY, -- Unchangeable ID
    company_name VARCHAR(255),
    logo_url TEXT
);

-- Initial Data Seed
INSERT INTO system_config (account_id, company_name, logo_url) VALUES ('PORTALS-001', 'Portals Pro', 'https://cdn.prod.website-files.com/66d6b6395835bed75848a0c8/67179fa63247ccb8c4e04805_portalspro.png');

INSERT INTO employees (name, email, role, department, position, location)
VALUES ('System Admin', 'admin@tvarana.com', 'Admin', 'IT', 'Administrator', 'Global');
```

---

## 2. Start the Backend Server
1. **Open a Terminal**.
2. **Install Deps**: `npm install express cors pg`.
3. **Run**: `node local_server.js`.

---

## 3. Start the Frontend
1. **Open a SECOND Terminal**.
2. **Run**: `npm run dev`.
3. Open `http://localhost:5173`.

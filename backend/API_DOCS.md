# Portals Pro Backend API Documentation

This documentation outlines the AWS Lambda-based backend infrastructure using PostgreSQL for data storage.

## Database Tables (PostgreSQL)

### 1. `employees`
Stores comprehensive profile data.
- **Columns**: `employee_id` (PK), `name`, `email` (Unique), `phone`, `role`, `department`, `position` (Designation), `manager_id`, `dob`, `doj`, `subsidiary`, `location`, `avatar_url`, `leaves_remaining`, `leaderboard_points`.

### 2. `attendance`
Tracks daily check-ins.
- **Columns**: `id` (PK), `employee_id` (FK), `date` (Unique index with employee_id), `check_in`, `check_out`, `status`.
- **Constraint**: Duplicate entries for the same employee on the same date are rejected.

### 3. `leaves`
Manages time-off requests.
- **Columns**: `id` (PK), `employee_id` (FK), `start_date`, `end_date`, `type`, `status` (Pending/Approved/Rejected), `reason`.

### 4. `compoff_ledger`
Tracks Comp-Off earnings and expirations.
- **Columns**: `id` (PK), `employee_id` (FK), `earned_date`, `expiry_date`, `status` (Available, Used, Expired), `reason`.
- **Logic**: Earned days are valid for 3 months excluding the month of earning.

### 5. `helpdesk_tickets`
Support system records.
- **Columns**: `ticket_id` (PK), `employee_id`, `subject`, `category`, `status`, `created_at`, `description`.

---

## API Endpoints & Lambda Mapping

| Method | Endpoint | Lambda Function File | Responsibility |
|--------|----------|----------------------|----------------|
| GET | `/employees` | `lambda_employees.js` | Fetch all or specific employee profile. |
| POST | `/employees` | `lambda_employees.js` | Add a new employee to the system. |
| PUT | `/employees/{id}` | `lambda_employees.js` | Update full profile of an employee. |
| POST | `/attendance` | `lambda_attendance.js` | **Punch In**: Record check-in time. <br> **Payload**: `{ "check_in": "ISO_DATE", ... }` |
| PUT | `/attendance` | `lambda_attendance.js` | **Punch Out**: Update check-out time for latest active record. <br> **Payload**: `{ "check_out": "ISO_DATE", "employee_id": 123 }` |
| GET | `/attendance` | `lambda_attendance.js` | **Check Status**: `?latest=true` returns the most recent punch record. <br> **History**: `?employee_id=123` returns full history. |
| POST | `/leaves` | `lambda_leaves.js` | Apply for leave (Validates against duplicates). |
| GET | `/approvals/{managerId}`| `lambda_approvals.js` | Fetch requests for direct reports. |
| PUT | `/approvals/{id}` | `lambda_approvals.js` | Approve or reject a request. |
| POST | `/compoff/earn` | `lambda_compoff.js` | Log earned comp-off with 3-month expiry. |
| GET | `/compoff/{id}` | `lambda_compoff.js` | Fetch available/used/expired comp-offs. |
| POST | `/tickets` | `lambda_tickets.js` | Create a support ticket. |
| GET | `/notifications` | `lambda_notifications.js` | Fetch recent notifications. <br> **Params**: `?email=user@example.com` |
| PUT | `/notifications` | `lambda_notifications.js` | Mark notification as read. <br> **Payload**: `{ "id": "uuid" }` |
| GET | `/policies` | `lambda_policies.js` | List all policies. |
| POST | `/policies` | `lambda_policies.js` | Create a new policy. |
| GET | `/policies/{id}` | `lambda_policies.js` | Get active/latest version of a policy. |
| PUT | `/policies/{id}` | `lambda_policies.js` | Update policy details (name, desc, status). <br> **Payload**: `{ "policy_name": "...", "is_active": true }` |
| GET | `/policies/{id}/versions` | `lambda_policies.js` | List version history of a policy. |
| GET | `/policies/{id}/versions/{versionId}` | `lambda_policies.js` | **Preview Version**: Get details & doc URL for a specific version (Draft/Archived). |
| POST | `/policies/{id}/versions` | `lambda_policies.js` | Create a new draft version. |
| PATCH | `/policies/{id}/versions/{versionId}/status` | `lambda_policies.js` | Approve a draft version. |

---

## Business Logic Rules

1. **Comp-Off Expiry**: When a Comp-Off is earned (e.g., Nov 15), the system calculates `expiry_date` as the last day of the month 3 months later (e.g., Feb 28). Current month (Nov) is excluded.
2. **Duplicate Prevention**: Every attendance/leave entry checks existing records for that specific date and employee ID. If a match exists, a 409 Conflict error is returned.
3. **Approvals**: The `approvals` endpoint automatically filters based on the `manager_id` provided in the request context, ensuring Managers only see their own team's requests. Admin roles override this filter.
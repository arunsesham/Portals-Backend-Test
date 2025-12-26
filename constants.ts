
// --- Clean Constants ---
import { Employee, Holiday, LeaveRequest, Ticket, Document, Goal, OnboardingTask, JobPosting, Referral, PayrollDocument, ApprovalRequest } from './types';

export const CURRENT_USER_ID = "1"; // Defaulting to the System Admin ID from your seed script

// --- Mock Data ---

export const MOCK_EMPLOYEES: Employee[] = [
  {
    employee_id: "1",
    name: "Venkatesh Cherasara",
    email: "venkatesh@portalspro.com",
    role: "Admin",
    avatar_url: "https://i.pravatar.cc/150?u=1",
    position: "System Architect",
    department: "Engineering",
    join_date: "2022-01-15",
    dob: "1990-05-20",
    leaves_remaining: 15,
    leaderboard_points: 1250,
    location: "Hyderabad",
    phone: "+91 9876543210"
  },
  {
    employee_id: "400",
    name: "John Doe",
    email: "john.doe@tvarana.com",
    role: "Employee",
    avatar_url: "https://i.pravatar.cc/150?u=400",
    position: "Software Engineer",
    department: "Technical",
    join_date: "2023-03-10",
    dob: "1995-08-15",
    leaves_remaining: 12,
    leaderboard_points: 850,
    location: "Hyderabad",
    phone: "+91 1234567890",
    manager_id: "1"
  }
];

export const MOCK_HOLIDAYS: Holiday[] = [
  { id: "h1", date: "2024-01-01", name: "New Year's Day", type: "Public", locations: ["All"] },
  { id: "h2", date: "2024-12-25", name: "Christmas", type: "Public", locations: ["All"] }
];

export const MOCK_LEAVES: LeaveRequest[] = [
  { id: "l1", employee_id: "400", start_date: "2024-06-01", end_date: "2024-06-05", type: "Vacation", status: "Approved", reason: "Summer Trip" }
];

export const MOCK_TICKETS: Ticket[] = [
  { ticket_id: "T1", employee_id: "400", subject: "Laptop screen flickering", category: "IT Support", status: "Open", created_at: "2023-11-20", description: "Monitor shows horizontal lines" }
];

export const MOCK_DOCS: Document[] = [
  { id: "d1", name: "Employee Handbook.pdf", category: "Policy", size: "2.4 MB", date: "2023-10-01", folder: "Company", employee_id: "1" }
];

export const MOCK_GOALS: Goal[] = [
  { id: "g1", title: "Complete System Migration", status: "On Track", progress: 75, dueDate: "2024-12-31" }
];

export const MOCK_ONBOARDING: OnboardingTask[] = [
  { id: "ot1", title: "Setup Workstation", dueDate: "2023-11-25", completed: true }
];

export const MOCK_JOBS: JobPosting[] = [
  { id: "j1", title: "Senior React Developer", department: "Technical", description: "Experienced dev needed", status: "Open", referral_bonus: "$500", applicants: 5 }
];

export const MOCK_REFERRALS: Referral[] = [
  { id: "r1", candidate_name: "Alice Smith", email: "alice@example.com", job_id: "j1", status: "Pending", created_at: "2023-11-15", dateReferred: "2023-11-15" }
];

export const MOCK_PAYROLL: PayrollDocument[] = [
  { id: "p1", month: "October", year: 2025, netSalary: 5000, status: "Paid", url: "#" }
];

export const MOCK_APPROVALS: ApprovalRequest[] = [
  { id: "a1", employee_id: "400", type: "Leave", start_date: "2024-12-01", end_date: "2024-12-02", reason: "Family Event", status: "Pending", dateInfo: "Dec 01 - Dec 02", details: "Family Event", requestDate: "2 days ago" }
];

export const MOCK_NEW_HIRES = [
    { id: "nh1", name: "Sarah Connor", position: "DevOps Engineer", dept: "Technical", joinDate: "2024-01-05", tasks: 5, completed: 2 }
];

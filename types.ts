
// --- The Blueprints (Data Contracts - Database Aligned) ---
export type UserRole = 'Employee' | 'Manager' | 'HR' | 'Lead' | 'Admin' | '79C Employee' | 'Accounting';

export interface Employee {
  employee_id: string;          
  name: string;        
  email: string;       
  role: UserRole;      
  avatar_url: string;      
  position: string;    
  department: string;  
  join_date: string;    
  dob: string;    
  leaves_remaining: number; 
  leaderboard_points: number;      
  location: string;    
  phone: string;       
  manager_id?: string;  
  subsidiary?: string; 
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  type: string;
  color: string;
  created_at: string;
}

export interface DashboardPulse {
    birthdays: { name: string, date: string, avatar: string }[];
    anniversaries: { name: string, years: number, date: string, avatar: string }[];
    announcements: Announcement[];
    leaderboard: any[];
    user_rankings?: any[];
    activity_graph: { name: string, hours: number }[];
}

export interface LeaveRequest {
  id: string;
  employee_id: string;  
  start_date: string;   
  end_date: string;     
  type: 'Sick' | 'Vacation' | 'Comp-Off' | 'Casual';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Revoked'; 
  reason: string;      
  supervisor_comment?: string;
}

export interface CompOffRecord {
    id: string;
    employee_id: string;
    earned_date: string;
    expiry_date: string;
    status: 'Available' | 'Used' | 'Expired';
    reason: string;
}

export interface ApprovalRequest {
    id: string;
    employee_id: string;
    employee_name?: string;
    type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    created_at?: string;
    // Added for UI compatibility
    dateInfo?: string;
    details?: string;
    requestDate?: string;
}

export interface Ticket {
  ticket_id: string;
  employee_id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  description: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  description: string;
  status: 'Open' | 'Closed';
  referral_bonus: string;
  applicants?: number;
}

export interface Referral {
  id: string;
  candidate_name: string;
  email: string;
  job_id: string;
  job_title?: string;
  status: string;
  created_at: string;
  dateReferred?: string;
}

export interface Holiday {
  id?: string;
  date: string;
  name: string;
  type: 'Public' | 'Optional';
  locations?: string[]; 
}

// --- Missing Interfaces Added ---
export interface Document {
  id: string;
  name: string;
  category: 'Policy' | 'Form';
  size: string;
  date: string;
  folder: 'Company' | 'Personal';
  employee_id: string | number;
  s3_url?: string;
}

export interface Goal {
  id: string;
  title: string;
  status: 'On Track' | 'Delayed' | 'Completed';
  progress: number;
  dueDate: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface PayrollDocument {
  id: string;
  month: string;
  year: number;
  netSalary: number;
  status: string;
  url: string;
}

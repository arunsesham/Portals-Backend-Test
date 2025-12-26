
import { Employee, DashboardPulse, LeaveRequest, Holiday, ApprovalRequest, Ticket, JobPosting, Referral, Document, PayrollDocument } from '../types';

const API_BASE_URL = 'http://localhost:3001'; 

const headers = { 'Content-Type': 'application/json' };

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Network error' }));
        throw new Error(err.message || 'Server error');
    }
    return res.json();
};

export const api = {
    // 1. Auth & Profile
    getCurrentUserByEmail: async (email: string): Promise<Employee | null> => {
        const res = await fetch(`${API_BASE_URL}/employees?email=${encodeURIComponent(email)}`);
        return await handleResponse(res);
    },

    getEmployeeById: async (id: string): Promise<Employee> => {
        const res = await fetch(`${API_BASE_URL}/employees/${id}`);
        return await handleResponse(res);
    },

    // 2. Dashboard & Announcements
    getDashboardPulse: async (): Promise<DashboardPulse> => {
        const res = await fetch(`${API_BASE_URL}/dashboard`);
        return await handleResponse(res);
    },
    
    updateAnnouncement: async (id: string, data: any) => {
        const res = await fetch(`${API_BASE_URL}/announcements/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
        return await handleResponse(res);
    },

    deleteAnnouncement: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/announcements/${id}`, { method: 'DELETE', headers });
        return await handleResponse(res);
    },

    // 3. Employees & Directory
    getEmployees: async (): Promise<Employee[]> => {
        const res = await fetch(`${API_BASE_URL}/employees`);
        return await handleResponse(res);
    },

    createEmployee: async (emp: Partial<Employee>) => {
        const res = await fetch(`${API_BASE_URL}/employees`, { method: 'POST', headers, body: JSON.stringify(emp) });
        return await handleResponse(res);
    },

    updateEmployee: async (id: string, emp: Partial<Employee>) => {
        const res = await fetch(`${API_BASE_URL}/employees/${id}`, { method: 'PUT', headers, body: JSON.stringify(emp) });
        return await handleResponse(res);
    },

    updatePoints: async (employeeId: string, points: number, actionByRole: string) => {
        const res = await fetch(`${API_BASE_URL}/leaderboard`, { 
            method: 'POST', 
            headers, 
            body: JSON.stringify({ employee_id: employeeId, points, action_by_role: actionByRole }) 
        });
        return await handleResponse(res);
    },

    // 4. Attendance & Leaves
    getAttendance: async (empId: string) => {
        const res = await fetch(`${API_BASE_URL}/attendance?employee_id=${empId}`);
        return await handleResponse(res);
    },

    recordAttendance: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/attendance`, { method: 'POST', headers, body: JSON.stringify(data) });
        return await handleResponse(res);
    },

    applyLeave: async (leave: Partial<LeaveRequest>) => {
        const res = await fetch(`${API_BASE_URL}/leaves`, { method: 'POST', headers, body: JSON.stringify(leave) });
        return await handleResponse(res);
    },

    // 5. Approvals & Audit Trail
    getApprovals: async (managerId: string): Promise<ApprovalRequest[]> => {
        const res = await fetch(`${API_BASE_URL}/approvals/${managerId}`);
        return await handleResponse(res);
    },

    updateApproval: async (id: string, status: string, comment?: string) => {
        const res = await fetch(`${API_BASE_URL}/approvals`, { 
            method: 'PUT', 
            headers, 
            body: JSON.stringify({ id, status, supervisor_comment: comment }) 
        });
        return await handleResponse(res);
    },

    // 6. Recruitment & Referrals
    getJobs: async (): Promise<JobPosting[]> => {
        const res = await fetch(`${API_BASE_URL}/jobs`);
        return await handleResponse(res);
    },

    postJob: async (job: any) => {
        const res = await fetch(`${API_BASE_URL}/jobs`, { method: 'POST', headers, body: JSON.stringify(job) });
        return await handleResponse(res);
    },

    editJob: async (id: string, job: any) => {
        const res = await fetch(`${API_BASE_URL}/jobs/${id}`, { method: 'PUT', headers, body: JSON.stringify(job) });
        return await handleResponse(res);
    },

    submitReferral: async (referral: any) => {
        const res = await fetch(`${API_BASE_URL}/referrals`, { method: 'POST', headers, body: JSON.stringify(referral) });
        return await handleResponse(res);
    },

    getMyReferrals: async (userId: string): Promise<Referral[]> => {
        const res = await fetch(`${API_BASE_URL}/referrals?referred_by=${userId}`);
        return await handleResponse(res);
    },

    // 7. Helpdesk
    createTicket: async (ticket: any) => {
        const res = await fetch(`${API_BASE_URL}/tickets`, { method: 'POST', headers, body: JSON.stringify(ticket) });
        return await handleResponse(res);
    },

    updateTicketStatus: async (id: string, status: string) => {
        const res = await fetch(`${API_BASE_URL}/tickets/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
        return await handleResponse(res);
    },

    // 8. Documents & S3
    getDocuments: async (folder: string): Promise<Document[]> => {
        const res = await fetch(`${API_BASE_URL}/documents?folder=${folder}`);
        return await handleResponse(res);
    },

    uploadDocument: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/documents`, { method: 'POST', headers, body: JSON.stringify(data) });
        return await handleResponse(res);
    },

    // 9. Payroll & S3
    getPayslips: async (empId: string): Promise<PayrollDocument[]> => {
        const res = await fetch(`${API_BASE_URL}/payroll/${empId}`);
        return await handleResponse(res);
    },

    // 10. Reports
    generateReport: async (params: any) => {
        const res = await fetch(`${API_BASE_URL}/reports`, { method: 'POST', headers, body: JSON.stringify(params) });
        return await handleResponse(res);
    },

    // 11. Holidays
    getHolidays: async (): Promise<Holiday[]> => {
        const res = await fetch(`${API_BASE_URL}/holidays`);
        return await handleResponse(res);
    },

    upsertHoliday: async (holiday: any) => {
        const method = holiday.id ? 'PUT' : 'POST';
        const url = holiday.id ? `${API_BASE_URL}/holidays/${holiday.id}` : `${API_BASE_URL}/holidays`;
        const res = await fetch(url, { method, headers, body: JSON.stringify(holiday) });
        return await handleResponse(res);
    },

    // 12. System Configuration
    updateSystemConfig: async (config: any) => {
        const res = await fetch(`${API_BASE_URL}/config`, { method: 'POST', headers, body: JSON.stringify(config) });
        return await handleResponse(res);
    }
};

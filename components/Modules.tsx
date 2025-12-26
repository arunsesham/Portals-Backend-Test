
import React, { useState, useEffect, useRef } from 'react';
import { 
  FiPlus, FiHeadphones, FiUsers, FiUser, FiChevronDown, FiFolder, FiTarget, FiUserPlus, 
  FiCheckCircle, FiBriefcase, FiShare2, FiFileText, FiDownload, FiZap, FiGrid, FiList, 
  FiSearch, FiMail, FiPhone, FiMoreHorizontal, FiX, FiEdit2, FiSave, FiTrash2, FiAward, 
  FiCalendar, FiClock, FiCheckSquare, FiClipboard, FiAlertTriangle, FiSend, FiArrowLeft, 
  FiFilter, FiFile, FiLock, FiUmbrella, FiPieChart, FiMoreVertical, FiPaperclip, FiFlag 
} from 'react-icons/fi';
import { BiSupport } from 'react-icons/bi';
import { RiCalendarScheduleLine } from 'react-icons/ri';
import { TbReport } from 'react-icons/tb'; // New requested icon
import { Card, Badge, Modal, CustomDropdown, DatePicker } from './Shared';
import { MOCK_TICKETS, MOCK_DOCS, MOCK_GOALS, MOCK_ONBOARDING, MOCK_JOBS, MOCK_REFERRALS, MOCK_PAYROLL, MOCK_EMPLOYEES, CURRENT_USER_ID, MOCK_APPROVALS } from '../constants';
import { JobPosting, Employee, ApprovalRequest, Ticket, Document, Goal, OnboardingTask, Referral, PayrollDocument } from '../types';

interface ModuleProps {
    notify?: (msg: string, type: 'success' | 'error') => void;
    userRole?: string;
    role?: string;
    user?: Employee;
}

// --- REPORTS MODULE ---
export const Reports = ({ userRole, notify }: ModuleProps) => {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('All Employees');
    const [reportType, setReportType] = useState<'Attendance' | 'Comp-Off' | 'Leave'>('Attendance');
    const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV'>('PDF');

    const employeeOptions = ['All Employees', ...MOCK_EMPLOYEES.map(e => e.name)];

    const handleExport = () => {
        if (!fromDate || !toDate) {
            notify?.("Please select date range for the report.", "error");
            return;
        }
        notify?.(`Exporting ${reportType} Report as ${exportFormat}...`, "success");
        setTimeout(() => {
            notify?.(`${reportType} Report downloaded successfully!`, "success");
        }, 1500);
    };

    const isAuthorized = ['Admin', 'Accounting', 'Manager', 'Lead', 'HR'].includes(userRole || '');

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center mb-6 shadow-sm border border-red-100 dark:border-red-900/10">
                    <FiLock size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">You do not have the necessary permissions to view organizational reports.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <TbReport className="text-brand" /> Reporting Engine
                    </h2>
                    <p className="text-sm text-gray-500">Generate and export organizational data reports.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 space-y-6 overflow-visible">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <FiFilter className="text-brand" /> Report Parameters
                    </h3>

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <DatePicker label="From Date" value={fromDate} onChange={setFromDate} />
                            <DatePicker label="To Date" value={toDate} onChange={setToDate} minDate={fromDate} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Employee Filter (Optional)</label>
                            <CustomDropdown 
                                options={employeeOptions}
                                value={selectedEmployee}
                                onChange={setSelectedEmployee}
                                fullWidth={true}
                                icon={FiUser}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Report Type</label>
                            <div className="grid grid-cols-1 gap-3">
                                {['Attendance', 'Comp-Off', 'Leave'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setReportType(type as any)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${reportType === type ? 'border-brand bg-brand/5 text-gray-900 dark:text-white ring-1 ring-brand/20' : 'border-gray-100 dark:border-white/10 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${reportType === type ? 'bg-brand text-brand-text' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                            {type === 'Attendance' ? <RiCalendarScheduleLine /> : type === 'Comp-Off' ? <FiCheckCircle /> : <FiUmbrella />}
                                        </div>
                                        {type} Report
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Export Format</label>
                            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-full">
                                <button 
                                    onClick={() => setExportFormat('PDF')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${exportFormat === 'PDF' ? 'bg-white dark:bg-darkcard shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}
                                >
                                    PDF Document
                                </button>
                                <button 
                                    onClick={() => setExportFormat('CSV')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${exportFormat === 'CSV' ? 'bg-white dark:bg-darkcard shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}
                                >
                                    CSV Spreadsheet
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={handleExport}
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                <FiDownload strokeWidth={3} /> Generate Report
                            </button>
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-2 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                        <h3 className="font-bold text-lg">Report History</h3>
                        <Badge color="bg-brand/10 text-brand-text font-bold">Authorized Access Only</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-[10px] uppercase text-gray-400 font-bold bg-gray-50 dark:bg-white/5">
                                <tr>
                                    <th className="p-4 pl-6">Report Name</th>
                                    <th className="p-4">Period</th>
                                    <th className="p-4">Generated By</th>
                                    <th className="p-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {[
                                    { name: 'Monthly Attendance - Oct', period: 'Oct 01 - Oct 31', user: 'Admin User', type: 'CSV' },
                                    { name: 'Q3 Leave Summary', period: 'Jul 01 - Sep 30', user: 'Admin User', type: 'PDF' },
                                    { name: 'Departmental Comp-Offs', period: 'Nov 01 - Nov 15', user: 'Finance Lead', type: 'PDF' }
                                ].map((report, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                                                    <FiFileText size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{report.name}</p>
                                                    <p className="text-[10px] text-gray-500">{report.type} Format</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400 font-medium">{report.period}</td>
                                        <td className="p-4 text-gray-500">{report.user}</td>
                                        <td className="p-4 pr-6 text-right">
                                            <button className="text-gray-400 hover:text-brand transition-colors"><FiDownload size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!fromDate && (
                            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                                <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4"><TbReport size={24} /></div>
                                <p className="text-sm font-medium">Select parameters and click "Generate" <br/> to see report data.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- APPROVALS MODULE ---
export const Approvals = ({ notify }: ModuleProps) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [filterType, setFilterType] = useState('All');
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [approverComment, setApproverComment] = useState('');
    const [revokeRequest, setRevokeRequest] = useState<ApprovalRequest | null>(null);
    const [revokeReason, setRevokeReason] = useState('');
    
    const [requestList, setRequestList] = useState<ApprovalRequest[]>([
        ...MOCK_APPROVALS,
        { id: "AP_HIST_1", employee_id: "401", type: "Leave", start_date: "2023-09-12", end_date: "2023-09-14", reason: "Medical Emergency", status: "Approved", dateInfo: "Sep 12 - Sep 14", details: "Medical Emergency", requestDate: "1 month ago" },
        { id: "AP_HIST_2", employee_id: "402", type: "Comp-Off", start_date: "2023-08-20", end_date: "2023-08-20", reason: "Weekend Support", status: "Rejected", dateInfo: "Aug 20", details: "Weekend Support", requestDate: "2 months ago" }
    ]);

    const filteredRequests = requestList.filter(req => {
        const matchesType = filterType === 'All' || req.type === filterType;
        const matchesTab = activeTab === 'pending' ? req.status === 'Pending' : (req.status === 'Approved' || req.status === 'Rejected');
        return matchesType && matchesTab;
    });

    const handleAction = (status: 'Approved' | 'Rejected') => {
        if (!selectedRequest) return;
        setRequestList(requestList.map(r => r.id === selectedRequest.id ? { ...r, status } : r));
        notify?.(`Request ${status} Successfully`, status === 'Approved' ? 'success' : 'error');
        setSelectedRequest(null);
        setApproverComment('');
    };

    const handleRevoke = () => {
        if (!revokeRequest || !revokeReason) { notify?.("Please provide a reason for revoking.", "error"); return; }
        setRequestList(requestList.map(r => r.id === revokeRequest.id ? { ...r, status: 'Rejected' as any } : r));
        notify?.("Request revoked successfully.", "success");
        setRevokeRequest(null);
        setRevokeReason('');
    };

    const getEmployeeDetails = (id: string) => MOCK_EMPLOYEES.find(e => e.employee_id === id);

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Approvals</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage team requests and history.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-48"><CustomDropdown options={['All', 'Leave', 'Attendance', 'Comp-Off']} value={filterType} onChange={setFilterType} fullWidth={true} /></div>
                </div>
            </div>
            <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Pending</button>
                <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>History</button>
            </div>
            <Card className="overflow-hidden min-h-[400px]">
                {filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-4"><FiClipboard size={32} /></div>
                        <p className="text-gray-500 font-medium">No {activeTab} requests found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-white/5">
                                <tr>
                                    <th className="p-4 pl-6">Employee</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Date(s)</th>
                                    <th className="p-4">Details</th>
                                    {activeTab === 'pending' && <th className="p-4">Submitted</th>}
                                    {activeTab === 'history' && <th className="p-4">Status</th>}
                                    <th className="p-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {filteredRequests.map(req => {
                                    const emp = getEmployeeDetails(req.employee_id);
                                    const dateInfo = req.dateInfo || `${req.start_date} - ${req.end_date}`;
                                    const details = req.details || req.reason;
                                    return (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <img src={emp?.avatar_url} className="w-9 h-9 rounded-full bg-gray-800 object-cover" alt="" />
                                                    <div><p className="font-bold text-gray-900 dark:text-white">{emp?.name}</p><p className="text-xs text-gray-500">{emp?.position}</p></div>
                                                </div>
                                            </td>
                                            <td className="p-4"><Badge color={req.type === 'Leave' ? 'bg-purple-100 text-purple-700' : req.type === 'Attendance' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>{req.type}</Badge></td>
                                            <td className="p-4 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><FiCalendar className="text-gray-400" /> {dateInfo}</td>
                                            <td className="p-4 max-w-[250px] truncate text-gray-600 dark:text-gray-400" title={details}>{details}</td>
                                            {activeTab === 'pending' && <td className="p-4 text-gray-500 text-xs">{req.requestDate}</td>}
                                            {activeTab === 'history' && <td className="p-4"><Badge color={req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{req.status}</Badge></td>}
                                            <td className="p-4 pr-6 text-right">
                                                {activeTab === 'pending' ? <button onClick={() => setSelectedRequest(req)} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-bold hover:opacity-90">Review</button> : req.status === 'Approved' && <button onClick={() => setRevokeRequest(req)} className="text-gray-400 hover:text-red-500 font-medium text-xs underline">Revoke</button>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title={`${selectedRequest?.type} Request`}>
                {selectedRequest && (() => {
                    const emp = getEmployeeDetails(selectedRequest.employee_id);
                    const dateInfo = selectedRequest.dateInfo || `${selectedRequest.start_date} - ${selectedRequest.end_date}`;
                    const details = selectedRequest.details || selectedRequest.reason;
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                <img src={emp?.avatar_url} className="w-14 h-14 rounded-full bg-gray-800 object-cover" alt="" />
                                <div><h3 className="font-bold text-lg text-gray-900 dark:text-white">{emp?.name}</h3><p className="text-sm text-gray-500">{emp?.position} • {emp?.department}</p></div>
                            </div>
                            <div className="space-y-4">
                                <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date(s)</label><p className="font-medium text-gray-900 dark:text-white text-lg">{dateInfo}</p></div>
                                <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reason provided by employee</label><p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-xl mt-1">{details}</p></div>
                                <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manager Remarks (Optional)</label><textarea value={approverComment} onChange={(e) => setApproverComment(e.target.value)} className="w-full mt-2 p-3 bg-white dark:bg-darkcard border border-gray-200 dark:border-white/10 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all" placeholder="Add a note..." rows={3}></textarea></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button onClick={() => handleAction('Rejected')} className="py-3.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Reject</button>
                                <button onClick={() => handleAction('Approved')} className="py-3.5 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all transform active:scale-[0.98]">Approve Request</button>
                            </div>
                        </div>
                    )
                })()}
            </Modal>
        </div>
    );
};

// --- DIRECTORY MODULE ---
export const Directory = ({ userRole, notify }: ModuleProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All Departments');
    const depts = ['All Departments', 'Products', 'Integration', 'Technical', 'Functional', 'Admin', 'Accounting'];
    const filteredEmployees = MOCK_EMPLOYEES.filter(emp => (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email.toLowerCase().includes(searchTerm.toLowerCase())) && (selectedDept === 'All Departments' || emp.department === selectedDept));
    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Directory</h2><p className="text-sm text-gray-500">Search colleagues across the company.</p></div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search names..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-darkcard border border-gray-200 dark:border-white/10 outline-none focus:border-brand transition-all text-sm" /></div>
                    <div className="w-full md:w-48"><CustomDropdown options={depts} value={selectedDept} onChange={setSelectedDept} fullWidth={true} /></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEmployees.map(emp => (
                    <Card key={emp.employee_id} className="group hover:shadow-xl transition-all duration-300 text-center">
                        <img src={emp.avatar_url} className="w-20 h-20 rounded-2xl bg-gray-800 mx-auto mb-4 object-cover" alt="" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-brand transition-colors">{emp.name}</h3>
                        <p className="text-xs text-gray-500 mb-2 font-medium">{emp.position}</p>
                        <Badge color="bg-gray-100 dark:bg-white/5 text-gray-500 mb-4">{emp.department}</Badge>
                        <div className="w-full pt-4 border-t border-gray-100 dark:border-white/5 flex justify-center gap-4">
                            <button className="p-2 text-gray-400 hover:text-brand transition-colors"><FiMail size={18}/></button>
                            <button className="p-2 text-gray-400 hover:text-brand transition-colors"><FiPhone size={18}/></button>
                            <button className="p-2 text-gray-400 hover:text-brand transition-colors"><FiShare2 size={18}/></button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- DOCUMENTS MODULE ---
export const Documents = ({ notify }: ModuleProps) => {
    const [activeFolder, setActiveFolder] = useState<'Company' | 'Personal'>('Company');
    const filteredDocs = MOCK_DOCS.filter(d => d.folder === activeFolder);
    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h2><p className="text-sm text-gray-500">Access policies and contracts.</p></div>
                <button onClick={() => notify?.("Feature coming soon", "success")} className="px-4 py-2 bg-brand text-brand-text rounded-xl font-bold text-sm flex items-center gap-2"><FiPlus /> Upload</button>
            </div>
            <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveFolder('Company')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeFolder === 'Company' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Company Files</button>
                <button onClick={() => setActiveFolder('Personal')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeFolder === 'Personal' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>My Documents</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map(doc => (
                    <Card key={doc.id} className="flex flex-col group hover:border-brand transition-colors">
                        <div className="flex items-start justify-between mb-4"><div className={`p-3 rounded-2xl ${doc.category === 'Policy' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'} dark:bg-white/5`}><FiFileText size={24} /></div><button className="text-gray-400 hover:text-brand"><FiMoreVertical /></button></div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{doc.name}</h3>
                        <p className="text-xs text-gray-500 mb-1">{doc.category} • {doc.size}</p>
                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-center"><span className="text-[10px] text-gray-400">Added {doc.date}</span><button className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500 hover:text-brand"><FiDownload size={16} /></button></div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- HELPDESK MODULE ---
export const Helpdesk = ({ notify }: ModuleProps) => {
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Helpdesk</h2><button onClick={() => setIsTicketModalOpen(true)} className="px-4 py-2 bg-brand text-brand-text rounded-xl font-bold text-sm flex items-center gap-2"><FiPlus /> New Ticket</button></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <h3 className="font-bold text-lg mb-4">Support Tickets</h3>
                    <div className="space-y-4">{MOCK_TICKETS.map(ticket => (<div key={ticket.ticket_id} className="p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-brand flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-white/5 text-blue-500 flex items-center justify-center"><BiSupport size={20} /></div><div><p className="font-bold text-sm text-gray-900 dark:text-white">{ticket.subject}</p><div className="flex items-center gap-2 mt-1"><Badge color="bg-gray-100 text-gray-600 dark:bg-white/5 text-[10px]">{ticket.category}</Badge><span className="text-[10px] text-gray-400">{ticket.created_at}</span></div></div></div><Badge color={ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{ticket.status}</Badge></div>))}</div>
                </Card>
                <Card className="flex flex-col items-center justify-center text-center p-8 bg-brand/5 border-brand/20"><div className="w-16 h-16 rounded-full bg-brand text-brand-text flex items-center justify-center mb-4 shadow-lg"><FiHeadphones size={32} /></div><h3 className="font-bold text-lg mb-2">Need Urgent Help?</h3><p className="text-sm text-gray-500 mb-6">Available Mon-Fri, 9AM-6PM IST.</p><button className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl text-sm">Contact Support</button></Card>
            </div>
            <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Create Support Ticket"><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none focus:border-brand" placeholder="Brief issue summary" /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label><select className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none"><option>IT Support</option><option>Finance/Payroll</option><option>Facilities</option></select></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label><textarea className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none focus:border-brand min-h-[100px]" placeholder="Detailed description..."></textarea></div><button onClick={() => { notify?.("Ticket submitted", "success"); setIsTicketModalOpen(false); }} className="w-full py-3 bg-brand text-brand-text font-bold rounded-xl mt-4">Create Ticket</button></div></Modal>
        </div>
    );
};

// --- PAYROLL MODULE ---
export const Payroll = () => {
    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><h3 className="font-bold text-lg mb-6">Payslips</h3><div className="space-y-4">{MOCK_PAYROLL.map(pay => (<div key={pay.id} className="p-4 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-between group hover:border-brand transition-colors"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center"><FiFileText size={20} /></div><div><p className="font-bold text-sm">{pay.month} {pay.year}</p><p className="text-xs text-gray-500">${pay.netSalary.toLocaleString()} Net Pay</p></div></div><div className="flex items-center gap-3"><Badge color="bg-green-100 text-green-700">{pay.status}</Badge><button className="p-2 text-gray-400 hover:text-brand transition-colors"><FiDownload /></button></div></div>))}</div></Card>
                <Card className="flex flex-col justify-center items-center text-center space-y-4 p-10 bg-gray-50 dark:bg-white/5"><FiLock size={40} className="text-gray-400" /><h3 className="font-bold text-lg">Tax Documents</h3><p className="text-sm text-gray-500">Available annually.</p><button className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold">View Tax Portal</button></Card>
            </div>
        </div>
    );
};

// --- PERFORMANCE MODULE ---
export const Performance = () => {
    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><h3 className="font-bold text-lg mb-6 flex items-center gap-2"><FiTarget className="text-brand" /> Active Goals</h3><div className="space-y-6">{MOCK_GOALS.map(goal => (<div key={goal.id} className="space-y-2"><div className="flex justify-between items-center"><p className="font-bold text-sm">{goal.title}</p><Badge color={goal.status === 'On Track' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>{goal.status}</Badge></div><div className="w-full bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden"><div className="bg-brand h-full rounded-full" style={{ width: `${goal.progress}%` }}></div></div><div className="flex justify-between items-center"><span className="text-[10px] text-gray-500">Due {goal.dueDate}</span><span className="text-[10px] font-bold text-brand">{goal.progress}% Complete</span></div></div>))}</div></Card>
                <Card className="bg-gray-900 text-white flex flex-col items-center justify-center p-10 relative overflow-hidden"><FiAward className="text-brand mb-6" /><h3 className="text-xl font-bold mb-2">Annual Review</h3><p className="text-gray-400 text-sm mb-6">Next review: March 2025.</p><button className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl text-sm">Review Guidelines</button></Card>
            </div>
        </div>
    );
};

// --- RECRUITMENT MODULE ---
export const Recruitment = ({ role, notify }: ModuleProps) => {
    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recruitment</h2>{(role === 'Admin' || role === 'HR') && (<button className="px-4 py-2 bg-brand text-brand-text rounded-xl font-bold text-sm flex items-center gap-2"><FiPlus /> Post Job</button>)}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_JOBS.map(job => (
                    <Card key={job.id} className="hover:border-brand transition-colors"><div className="flex justify-between items-start mb-4"><Badge color="bg-blue-100 text-blue-700">{job.department}</Badge><span className="text-[10px] text-gray-400 font-bold">{job.applicants} Applicants</span></div><h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{job.title}</h3><p className="text-xs text-gray-500 mb-6">Bonus: {job.referral_bonus}</p><div className="flex gap-2"><button className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-bold">View Details</button><button className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500"><FiShare2 size={14}/></button></div></Card>
                ))}
            </div>
        </div>
    );
};

// --- REFERRALS MODULE ---
export const Referrals = ({ notify }: ModuleProps) => {
    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Referrals</h2><button onClick={() => notify?.("Referral portal opened", "success")} className="px-4 py-2 bg-brand text-brand-text rounded-xl font-bold text-sm flex items-center gap-2"><FiUserPlus /> Refer Colleague</button></div>
            <Card><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-bold uppercase text-gray-400"><tr><th className="p-4 pl-6">Candidate</th><th className="p-4">Job ID</th><th className="p-4">Referred On</th><th className="p-4">Status</th><th className="p-4 pr-6 text-right">Action</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-white/5">{MOCK_REFERRALS.map(ref => (<tr key={ref.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"><td className="p-4 pl-6 font-bold">{ref.candidate_name}</td><td className="p-4 text-gray-500">{ref.job_id}</td><td className="p-4 text-gray-400">{ref.dateReferred}</td><td className="p-4"><Badge color="bg-blue-100 text-blue-700">{ref.status}</Badge></td><td className="p-4 pr-6 text-right"><button className="text-brand text-xs font-bold hover:underline">Track Progress</button></td></tr>))}</tbody></table></div></Card>
        </div>
    );
};

// --- ONBOARDING MODULE ---
export const Onboarding = ({ role, notify }: ModuleProps) => {
    const [tasks, setTasks] = useState(MOCK_ONBOARDING);
    const toggleTask = (id: string) => setTasks(tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t));
    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Onboarding</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2"><h3 className="font-bold text-lg mb-6">Checklist</h3><div className="space-y-4">{tasks.map(task => (<div key={task.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5 group"><button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-brand border-brand text-white' : 'border-gray-200 group-hover:border-brand'}`}>{task.completed && <FiCheckCircle size={14} />}</button><div className="flex-1"><p className={`font-bold text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</p><p className="text-[10px] text-gray-500">Due {task.dueDate}</p></div></div>))}</div></Card>
                <Card className="flex flex-col items-center justify-center text-center p-10 bg-blue-50 dark:bg-white/5"><div className="w-16 h-16 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-4"><FiFlag size={32} /></div><h3 className="font-bold text-lg mb-2">Welcome Aboard!</h3><div className="w-full bg-gray-200 dark:bg-white/10 h-2 rounded-full mb-2 overflow-hidden"><div className="bg-brand h-full" style={{ width: '33%' }}></div></div><p className="text-[10px] font-bold text-brand uppercase">33% Complete</p></Card>
            </div>
        </div>
    );
};

// --- PROFILE VIEW MODULE ---
export const ProfileView = ({ user }: ModuleProps) => {
    if (!user) return null;
    return (
        <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
            <Card className="p-0 overflow-hidden">
                <div className="h-32 bg-gray-900 dark:bg-black w-full relative"></div>
                <div className="px-10 pb-10 relative">
                    <div className="flex flex-col md:flex-row items-end gap-6 -mt-12 mb-6"><div className="relative"><img src={user.avatar_url} className="w-32 h-32 rounded-[2rem] border-4 border-white dark:border-darkcard bg-gray-800 shadow-xl object-cover" alt="" /><div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-brand text-brand-text flex items-center justify-center border-4 border-white dark:border-darkcard"><FiEdit2 size={16} /></div></div><div className="flex-1"><h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h2><p className="text-gray-500 font-medium">{user.position} • {user.department}</p></div><div className="flex gap-2"><button className="px-6 py-2.5 bg-brand text-brand-text rounded-xl font-bold text-sm shadow-lg shadow-brand/20">Edit Profile</button></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8"><div><h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">About Me</h3><p className="text-gray-600 dark:text-gray-300 leading-relaxed">Dedicated professional focused on delivering high-quality solutions.</p></div><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-bold text-gray-400 uppercase">Email</label><p className="text-sm font-bold">{user.email}</p></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Location</label><p className="text-sm font-bold">{user.location}</p></div></div></div>
                        <div className="space-y-6"><div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-center"><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Points</p><h3 className="text-4xl font-black text-brand">{user.leaderboard_points}</h3></div></div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

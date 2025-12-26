
import React, { useState, useEffect } from 'react';
import { FiPlus, FiTag, FiCalendar, FiClock, FiAlertCircle } from 'react-icons/fi';
import { Card, Badge, Modal, DatePicker, CustomDropdown } from './Shared';
import { api } from '../services/api';
import { LeaveRequest, CompOffRecord, Employee } from '../types';
import { CURRENT_USER_ID } from '../constants';

export const Leaves = ({ notify }: { notify: (msg: string, type: 'success' | 'error') => void }) => {
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [leaveType, setLeaveType] = useState('Sick');
    const [reason, setReason] = useState('');
    
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [compOffs, setCompOffs] = useState<CompOffRecord[]>([]);
    const [user, setUser] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const emp = await api.getEmployeeById(CURRENT_USER_ID);
            const resLeaves = await api.getAttendance(CURRENT_USER_ID); // Reusing logic for history
            
            // Fetching comp-offs specifically
            const resCompOffs = await fetch(`http://localhost:3001/compoff?employee_id=${CURRENT_USER_ID}`).then(r => r.json());
            
            setUser(emp);
            setLeaves(Array.isArray(resLeaves) ? resLeaves : []);
            // Filter out Expired comp-offs as requested
            setCompOffs(Array.isArray(resCompOffs) ? resCompOffs.filter((c: CompOffRecord) => c.status !== 'Expired') : []);
        } catch (err) {
            notify("Failed to load leave data", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async () => {
        if(!fromDate || !toDate || !reason) {
            notify("Please complete all fields.", "error");
            return;
        }
        try {
            await api.applyLeave({
                employee_id: CURRENT_USER_ID,
                start_date: fromDate,
                end_date: toDate,
                type: leaveType as any,
                reason: reason
            });
            setIsApplyModalOpen(false);
            notify("Leave request submitted successfully!", "success");
            setFromDate('');
            setToDate('');
            setReason('');
            loadData();
        } catch (err: any) {
            notify(err.message || "Failed to submit leave", "error");
        }
    }

    const availableCompOffCount = compOffs.filter(c => c.status === 'Available').length;

    return (
        <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Time Off Management</h2>
                    <p className="text-sm text-gray-500">View balances and track your leave requests.</p>
                </div>
                <button 
                    onClick={() => setIsApplyModalOpen(true)}
                    className="bg-brand text-brand-text px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-brand/20 active:scale-95"
                >
                    <FiPlus strokeWidth={3} /> Apply for Leave
                </button>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <Card className="p-6 border-l-4 border-blue-500">
                     <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Annual Quota</h3>
                     <p className="text-3xl font-black text-gray-900 dark:text-white">{user?.leaves_remaining || 0}</p>
                     <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Days Available</p>
                 </Card>
                 <Card className="p-6 border-l-4 border-green-500">
                     <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Approved</h3>
                     <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {leaves.filter(l => l.status === 'Approved').length}
                     </p>
                     <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Days Taken</p>
                 </Card>
                 <Card className="p-6 border-l-4 border-yellow-500">
                     <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Pending</h3>
                     <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {leaves.filter(l => l.status === 'Pending').length}
                     </p>
                     <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Awaiting Action</p>
                 </Card>
                 <Card className="p-6 border-l-4 border-brand">
                     <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Comp-Offs</h3>
                     <p className="text-3xl font-black text-brand">{availableCompOffCount}</p>
                     <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Valid Days</p>
                 </Card>
            </div>

            {/* Comp-Off Ledger Section - Tabular Form */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiClock className="text-brand" />
                    <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-widest">Active Comp-Off Ledger</h3>
                </div>
                <Card noPadding={true}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100 dark:border-white/5">
                                <tr>
                                    <th className="p-4 pl-6">Earned Date</th>
                                    <th className="p-4">Expiry Date</th>
                                    <th className="p-4">Reason</th>
                                    <th className="p-4 pr-6 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {compOffs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-gray-400 italic">No active comp-off days available.</td>
                                    </tr>
                                ) : compOffs.map(co => (
                                    <tr key={co.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-4 pl-6 font-bold text-gray-900 dark:text-white">{new Date(co.earned_date).toLocaleDateString()}</td>
                                        <td className="p-4 font-bold text-red-500">{new Date(co.expiry_date).toLocaleDateString()}</td>
                                        <td className="p-4 text-gray-500 font-medium">{co.reason}</td>
                                        <td className="p-4 pr-6 text-right">
                                            <Badge color={co.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                                                {co.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Leave History Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiCalendar className="text-blue-500" />
                    <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-widest">Application History</h3>
                </div>
                <Card noPadding={true}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100 dark:border-white/5">
                                <tr>
                                    <th className="p-4 pl-6">Type</th>
                                    <th className="p-4">Duration</th>
                                    <th className="p-4">Reason</th>
                                    <th className="p-4 pr-6 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {leaves.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-gray-400 italic">No historical leave applications.</td>
                                    </tr>
                                ) : leaves.map(leave => (
                                    <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6 font-black text-gray-900 dark:text-white">{leave.type.toUpperCase()}</td>
                                        <td className="p-4">
                                            <div className="text-gray-900 dark:text-white font-bold">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4 text-gray-500 max-w-[250px] truncate" title={leave.reason}>{leave.reason}</td>
                                        <td className="p-4 pr-6 text-right">
                                            <Badge color={
                                                leave.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                                                leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                                                leave.status === 'Revoked' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                                            }>{leave.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Apply for Time Off">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative z-30">
                            <DatePicker label="Start Date" value={fromDate} onChange={setFromDate} />
                        </div>
                        <div className="relative z-30">
                            <DatePicker label="End Date" value={toDate} onChange={setToDate} minDate={fromDate} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Leave Category</label>
                        <CustomDropdown 
                            options={['Sick', 'Casual', 'Vacation', 'Comp-Off']}
                            value={leaveType}
                            onChange={setLeaveType}
                            fullWidth={true}
                            icon={FiTag}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detailed Reason</label>
                        <textarea 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:border-brand min-h-[120px] transition-all text-sm" 
                            placeholder="Please explain the requirement..."
                        ></textarea>
                    </div>
                    <button 
                        onClick={handleSubmit} 
                        className="w-full py-4 bg-brand text-brand-text font-black rounded-2xl shadow-xl hover:bg-brand-hover transition-all transform active:scale-[0.98]"
                    >
                        Submit Request for Approval
                    </button>
                </div>
            </Modal>
        </div>
    );
};


import React, { useState } from 'react';
import { FiClipboard, FiCalendar, FiCheckCircle, FiX, FiAlertTriangle, FiUser, FiInfo } from 'react-icons/fi';
import { Card, Badge, Modal, CustomDropdown } from './Shared';
import { MOCK_APPROVALS, MOCK_EMPLOYEES } from '../constants';
import { ApprovalRequest } from '../types';

export const Approvals = ({ notify, currentUserId, userRole }: { notify: (msg: string, type: 'success' | 'error') => void, currentUserId: string, userRole: string }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [filterType, setFilterType] = useState('All');
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [requestList, setRequestList] = useState<ApprovalRequest[]>(MOCK_APPROVALS);

    const isAdmin = userRole === 'Admin';

    // Logic: Manager sees reports where managerId === currentUserId. Admin sees all.
    const filteredRequests = requestList.filter(req => {
        const emp = MOCK_EMPLOYEES.find(e => e.employee_id === req.employee_id);
        const isReport = emp?.manager_id === currentUserId;
        const hasAccess = isAdmin || isReport;
        
        const matchesType = filterType === 'All' || req.type === filterType;
        const matchesTab = activeTab === 'pending' ? req.status === 'Pending' : req.status !== 'Pending';
        
        return hasAccess && matchesType && matchesTab;
    });

    const handleAction = (status: 'Approved' | 'Rejected') => {
        if (!selectedRequest) return;
        setRequestList(requestList.map(r => r.id === selectedRequest.id ? { ...r, status } : r));
        notify(`Request ${status} Successfully`, status === 'Approved' ? 'success' : 'error');
        setSelectedRequest(null);
    };

    const getEmployeeDetails = (id: string) => MOCK_EMPLOYEES.find(e => e.employee_id === id);

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Approvals</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Review and manage team requests for your direct reports.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-48"><CustomDropdown options={['All', 'Leave', 'Attendance', 'Comp-Off']} value={filterType} onChange={setFilterType} fullWidth={true} /></div>
                </div>
            </div>

            <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-fit shadow-inner">
                <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${activeTab === 'pending' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Pending</button>
                <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${activeTab === 'history' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>History</button>
            </div>

            <Card className="overflow-hidden min-h-[400px]" noPadding={true}>
                {filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 text-gray-300 flex items-center justify-center mb-4">
                            <FiClipboard size={32} />
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No {activeTab} actions found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-white/5 text-[10px] uppercase text-gray-500 font-black tracking-widest border-b border-gray-100 dark:border-white/5">
                                <tr>
                                    <th className="p-4 pl-6">Employee</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Date(s)</th>
                                    <th className="p-4">Details</th>
                                    {activeTab === 'history' && <th className="p-4">Final Status</th>}
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
                                                    <img src={emp?.avatar_url} className="w-9 h-9 rounded-xl bg-gray-800 object-cover shadow-sm" alt="" />
                                                    <span className="font-bold text-gray-900 dark:text-white">{emp?.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge color={req.type === 'Leave' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}>
                                                    {req.type}
                                                </Badge>
                                            </td>
                                            <td className="p-4 font-bold text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-2"><FiCalendar className="text-gray-400" /> {dateInfo}</div>
                                            </td>
                                            <td className="p-4 max-w-[200px] truncate text-gray-500 dark:text-gray-400 font-medium">
                                                {details}
                                            </td>
                                            {activeTab === 'history' && (
                                                <td className="p-4">
                                                    <Badge color={req.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}>
                                                        {req.status}
                                                    </Badge>
                                                </td>
                                            )}
                                            <td className="p-4 pr-6 text-right">
                                                {activeTab === 'pending' ? (
                                                    <button onClick={() => setSelectedRequest(req)} className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[10px] font-black tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all shadow-md">Review</button>
                                                ) : (
                                                    <button onClick={() => { setSelectedRequest(req); setActiveTab('pending'); }} className="text-brand text-[10px] font-black uppercase tracking-widest hover:underline">Re-examine</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Request Deliberation">
                {selectedRequest && (() => {
                    const emp = getEmployeeDetails(selectedRequest.employee_id);
                    const dateInfo = selectedRequest.dateInfo || `${selectedRequest.start_date} - ${selectedRequest.end_date}`;
                    const details = selectedRequest.details || selectedRequest.reason;
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-inner">
                                <img src={emp?.avatar_url} className="w-16 h-16 rounded-2xl bg-gray-800 object-cover shadow-md" alt="" />
                                <div>
                                    <h3 className="font-black text-xl text-gray-900 dark:text-white leading-tight">{emp?.name}</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{emp?.position} • {emp?.department}</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Submitted Details</label>
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed italic">"{details}"</p>
                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/5 flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <FiCalendar /> {dateInfo}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button onClick={() => handleAction('Rejected')} className="py-4 px-4 rounded-2xl border-2 border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-95">Decline Request</button>
                                    <button onClick={() => handleAction('Approved')} className="py-4 px-4 bg-brand text-brand-text font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-brand/20 active:scale-95 transition-all">Grant Approval</button>
                                </div>
                            </div>
                        </div>
                    )
                })()}
            </Modal>
        </div>
    );
};

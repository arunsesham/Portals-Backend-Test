
import React, { useState, useEffect } from 'react';
import { FiSearch, FiMail, FiMoreHorizontal, FiPhone, FiInfo, FiGrid, FiList, FiPlus, FiEdit2, FiAward } from 'react-icons/fi';
import { Card, Badge, Modal, CustomDropdown, DatePicker } from './Shared';
import { Employee } from '../types';
import { api } from '../services/api';

export const Directory = ({ notify, userRole }: { notify: (msg: string, type: 'success' | 'error') => void, userRole?: string }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPointModalOpen, setIsPointModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Employee>>({});

    const loadEmployees = async () => {
        try {
            const data = await api.getEmployees();
            setEmployees(data);
        } catch (err) { notify("Failed to sync directory", "error"); }
    };

    useEffect(() => { loadEmployees(); }, []);

    const handleSave = async () => {
        try {
            if (isAddModalOpen) {
                await api.createEmployee(formData);
                notify("Employee profile created successfully.", "success");
            } else if (isEditModalOpen) {
                await api.updateEmployee(formData.employee_id!, formData);
                notify("Employee records updated.", "success");
            } else if (isPointModalOpen) {
                await api.updatePoints(formData.employee_id!, formData.leaderboard_points || 0, userRole || 'Admin');
                notify("Reward points updated successfully.", "success");
            }
            setIsEditModalOpen(false); setIsAddModalOpen(false); setIsPointModalOpen(false);
            loadEmployees();
        } catch (err: any) { notify(err.message || "Operation failed", "error"); }
    };

    const filtered = employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Organizational Directory</h2>
                    <p className="text-sm text-gray-500">Discover and manage team members.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search names..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 outline-none focus:border-brand bg-white dark:bg-darkcard text-sm" 
                        />
                    </div>
                    {['Admin', 'HR'].includes(userRole || '') && (
                        <button onClick={() => { setFormData({}); setIsAddModalOpen(true); }} className="px-4 py-2.5 bg-brand text-brand-text rounded-xl font-black text-sm shadow-lg shadow-brand/20 active:scale-95 transition-transform">Add Employee</button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map(emp => (
                    <Card key={emp.employee_id} className="text-center group relative pt-8 hover:border-brand transition-all">
                        <img src={emp.avatar_url || 'https://placehold.co/200'} className="w-24 h-24 rounded-3xl mx-auto mb-4 object-cover shadow-lg border-2 border-white dark:border-white/5" />
                        <h3 className="font-black text-lg text-gray-900 dark:text-white group-hover:text-brand transition-colors">{emp.name}</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">{emp.position}</p>
                        <Badge color="bg-brand/10 text-brand-text font-black px-4">{emp.department}</Badge>
                        
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-center gap-3">
                            <button onClick={() => setSelectedEmployee(emp)} className="p-2 text-gray-400 hover:text-brand transition-colors"><FiInfo size={18}/></button>
                            {['Admin', 'HR'].includes(userRole || '') && (
                                <>
                                    <button onClick={() => { setFormData(emp); setIsEditModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><FiEdit2 size={16}/></button>
                                    <button onClick={() => { setFormData(emp); setIsPointModalOpen(true); }} className="p-2 text-yellow-500 hover:scale-125 transition-transform"><FiAward size={16}/></button>
                                </>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Point Management Modal */}
            <Modal isOpen={isPointModalOpen} onClose={() => setIsPointModalOpen(false)} title="Update Reward Points">
                <div className="space-y-6">
                    <div className="text-center">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Set Points for</p>
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white">{formData.name}</h4>
                    </div>
                    <input 
                        type="number" 
                        value={formData.leaderboard_points || 0} 
                        onChange={e => setFormData({...formData, leaderboard_points: parseInt(e.target.value)})} 
                        className="w-full p-6 rounded-3xl border-2 border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 outline-none focus:border-brand text-4xl font-black text-center text-brand"
                    />
                    <button onClick={handleSave} className="w-full py-4 bg-brand text-brand-text font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">Update Leaderboard</button>
                </div>
            </Modal>

            {/* Profile Detail Modal */}
            <Modal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title="Personnel Profile">
                {selectedEmployee && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-inner">
                            <img src={selectedEmployee.avatar_url} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                            <div>
                                <h3 className="font-black text-xl text-gray-900 dark:text-white leading-tight">{selectedEmployee.name}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{selectedEmployee.position}</p>
                                <Badge color="bg-brand/10 text-brand-text font-black mt-2 inline-block px-3">{selectedEmployee.department}</Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-gray-100 dark:border-white/5">
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Work Email</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{selectedEmployee.email}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-gray-100 dark:border-white/5">
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Location</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedEmployee.location}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-gray-100 dark:border-white/5">
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Joined Date</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{new Date(selectedEmployee.join_date).toLocaleDateString()}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-gray-100 dark:border-white/5">
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Employee ID</label>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">#{selectedEmployee.employee_id}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

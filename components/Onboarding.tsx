import React, { useState } from 'react';
import { FiCheckCircle, FiFlag, FiUser, FiCalendar, FiArrowRight, FiCheckSquare, FiPlus, FiUserPlus } from 'react-icons/fi';
// Fixed missing DatePicker import
import { Card, Badge, Modal, DatePicker } from './Shared';
import { MOCK_NEW_HIRES } from '../constants';

export const Onboarding = ({ role, notify }: { role: string, notify: (msg: string, type: 'success' | 'error') => void }) => {
    const [selectedHire, setSelectedHire] = useState<any>(null);
    const [hires, setHires] = useState(MOCK_NEW_HIRES);
    const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

    const toggleHireTask = (hireId: string, taskIdx: number) => {
        setHires(prev => prev.map(h => {
            if (h.id === hireId) {
                // To simulate realistic progress, we assume tasks are sequential for this demo
                // Each click completes the "next" task in the mock list
                const nextCompleted = Math.min(h.tasks, h.completed + 1);
                if (nextCompleted === h.tasks) notify(`Onboarding for ${h.name} is complete!`, 'success');
                return { ...h, completed: nextCompleted };
            }
            return h;
        }));
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Hire Onboarding</h2>
                    <p className="text-sm text-gray-500">Track and manage the integration of new team members.</p>
                </div>
                {(role === 'HR' || role === 'Admin') && (
                    <button 
                        onClick={() => setIsOnboardModalOpen(true)}
                        className="px-4 py-2.5 bg-brand text-brand-text rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand/20"
                    >
                        <FiUserPlus strokeWidth={3} /> Onboard New Employee
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {hires.map(hire => {
                    const progress = (hire.completed / hire.tasks) * 100;
                    return (
                        <Card key={hire.id} className="group hover:border-brand transition-colors">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                                    <FiUser size={28} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{hire.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium">{hire.position} • {hire.dept}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pt-1">
                                        <FiCalendar /> Official Joining: {hire.joinDate}
                                    </div>
                                </div>
                                <div className="w-full md:w-64 space-y-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-brand uppercase">{hire.completed} of {hire.tasks} tasks finished</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">{Math.round(progress)}%</p>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="bg-brand h-full transition-all duration-700 ease-out shadow-sm" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                                    <button 
                                        onClick={() => setSelectedHire(hire)}
                                        className="flex-1 md:px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-md"
                                    >
                                        Manage Workflow
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Checklist Modal */}
            <Modal isOpen={!!selectedHire} onClose={() => setSelectedHire(null)} title={`Onboarding Flow: ${selectedHire?.name}`}>
                {selectedHire && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {[
                                "Identity Document Verification",
                                "Corporate Email & Slack Setup",
                                "Laptop Provisioning & Asset Handover",
                                "HR Induction & Policy Briefing",
                                "Project Team Kick-off Session"
                            ].map((task, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group transition-all">
                                    <button 
                                        onClick={() => toggleHireTask(selectedHire.id, idx)}
                                        className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all shadow-sm ${idx < selectedHire.completed ? 'bg-brand border-brand text-brand-text' : 'bg-white dark:bg-darkcard border-gray-200 dark:border-white/10 group-hover:border-brand'}`}
                                    >
                                        {idx < selectedHire.completed ? <FiCheckCircle size={20} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700"></div>}
                                    </button>
                                    <div className="flex-1">
                                        <p className={`text-sm font-black ${idx < selectedHire.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{task}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Requirement {idx + 1}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                            <button onClick={() => setSelectedHire(null)} className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black hover:text-brand transition-colors text-xs rounded-2xl uppercase tracking-widest">Done for now</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* New Onboarding Modal */}
            <Modal isOpen={isOnboardModalOpen} onClose={() => setIsOnboardModalOpen(false)} title="New Employee Enrollment">
                <div className="space-y-5">
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Candidate Full Name</label><input type="text" className="w-full p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-brand outline-none font-medium" placeholder="e.g. Alice Cooper" /></div>
                    <div className="grid grid-cols-2 gap-4">
                         <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Designation</label><input type="text" className="w-full p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-brand outline-none font-medium" placeholder="Job Title" /></div>
                         <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Department</label><select className="w-full p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-brand outline-none font-medium appearance-none"><option>Technical</option><option>Products</option><option>Finance</option><option>Admin</option></select></div>
                    </div>
                    {/* Fixed missing DatePicker import on line 121 */}
                    <DatePicker label="Projected Start Date" value="" onChange={() => {}} />
                    <button 
                        onClick={() => { notify("Onboarding initialized", "success"); setIsOnboardModalOpen(false); }}
                        className="w-full py-4 bg-brand text-brand-text font-black rounded-2xl shadow-xl mt-4 active:scale-[0.98] transition-transform"
                    >
                        Initialize Onboarding Flow
                    </button>
                </div>
            </Modal>
        </div>
    );
};
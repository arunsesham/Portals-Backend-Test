import React, { useState } from 'react';
import { FiUserPlus, FiBriefcase, FiArrowRight, FiUpload, FiSend } from 'react-icons/fi';
import { Card, Badge, Modal } from './Shared';
import { MOCK_REFERRALS, MOCK_JOBS } from '../constants';
import { JobPosting } from '../types';

export const Referrals = ({ notify }: { notify: (msg: string, type: 'success' | 'error') => void }) => {
    const [referralModalJob, setReferralModalJob] = useState<JobPosting | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', linkedin: '' });

    const handleRefer = () => {
        if (!formData.name || !formData.email) {
            notify("Please provide name and email of the candidate.", "error");
            return;
        }
        notify(`Referral submitted for ${formData.name} to the ${referralModalJob?.title} position!`, "success");
        setReferralModalJob(null);
        setFormData({ name: '', email: '', linkedin: '' });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Referrals Portal</h2>
                <p className="text-sm text-gray-500 mt-1">Help us grow the team by referring talented individuals you know.</p>
            </div>

            {/* Open Positions for Referral */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FiBriefcase className="text-brand" /> Open Positions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_JOBS.map(job => (
                        <Card key={job.id} className="hover:border-brand transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <Badge color="bg-blue-100 text-blue-700">{job.department}</Badge>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{job.title}</h3>
                            <p className="text-xs text-gray-500 mb-6">Positions open for employee referral. Join us in building the future.</p>
                            <button 
                                onClick={() => setReferralModalJob(job)}
                                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                Refer Candidate <FiArrowRight />
                            </button>
                        </Card>
                    ))}
                </div>
            </div>

            {/* My Referrals History */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg">My Referral History</h3>
                <Card noPadding={true}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-100 dark:border-white/5">
                                <tr>
                                    <th className="p-4 pl-6">Candidate</th>
                                    <th className="p-4">Job ID</th>
                                    <th className="p-4">Referred On</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {MOCK_REFERRALS.map(ref => (
                                    <tr key={ref.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6 font-bold">{ref.candidateName}</td>
                                        <td className="p-4 text-gray-500">{ref.jobId}</td>
                                        <td className="p-4 text-gray-400">{ref.dateReferred}</td>
                                        <td className="p-4"><Badge color="bg-blue-100 text-blue-700">{ref.status}</Badge></td>
                                        <td className="p-4 pr-6 text-right">
                                            <button className="text-brand text-xs font-bold hover:underline">Track Progress</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Referral Modal */}
            <Modal isOpen={!!referralModalJob} onClose={() => setReferralModalJob(null)} title={`Refer for ${referralModalJob?.title}`}>
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Candidate Full Name</label>
                        <input 
                            type="text" 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none focus:border-brand" 
                            placeholder="John Doe" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Candidate Email</label>
                        <input 
                            type="email" 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none focus:border-brand" 
                            placeholder="john@example.com" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload Resume (PDF)</label>
                        <div className="w-full p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-brand hover:bg-brand/5 transition-all cursor-pointer">
                            <FiUpload className="text-gray-400" size={24} />
                            <p className="text-xs text-gray-500 font-medium">Click to select or drag and drop</p>
                        </div>
                    </div>
                    <button onClick={handleRefer} className="w-full py-4 bg-brand text-brand-text font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg mt-4">
                        <FiSend /> Submit Referral
                    </button>
                </div>
            </Modal>
        </div>
    );
};
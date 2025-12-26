
import React, { useState } from 'react';
import { FiPlus, FiBriefcase, FiExternalLink, FiGlobe, FiInfo, FiTrash2, FiUser, FiFileText, FiMail, FiLinkedin, FiGithub } from 'react-icons/fi';
import { Card, Badge, Modal } from './Shared';
import { MOCK_JOBS } from '../constants';
import { JobPosting } from '../types';

export const Recruitment = ({ role, notify }: { role: string, notify: (msg: string, type: 'success' | 'error') => void }) => {
    const [jobs, setJobs] = useState(MOCK_JOBS);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [newJob, setNewJob] = useState({ title: '', dept: 'Technical', url: '', desc: '' });

    const MOCK_APPLICANTS = [
        { name: "John Smith", email: "john.smith@example.com", resume: "resume_v1.pdf", url: "linkedin.com/in/johnsmith", source: "Internal Referral" },
        { name: "Jane Cooper", email: "jane.cooper@example.com", resume: "jane_resume_final.pdf", url: "portfolio.design/jane", source: "LinkedIn" },
        { name: "Cody Fisher", email: "cody.fisher@example.com", resume: "cody_fisher_cv.pdf", url: "github.com/codyf", source: "Careers Portal" }
    ];

    const handlePostJob = () => {
        if (!newJob.title || !newJob.url) {
            notify("Title and URL are required.", "error");
            return;
        }
        const post: JobPosting = {
            id: `J${Date.now()}`,
            title: newJob.title,
            department: newJob.dept,
            applicants: 0,
            status: 'Open',
            referral_bonus: '$0',
            description: newJob.desc
        };
        setJobs([post, ...jobs]);
        setIsPostModalOpen(false);
        setNewJob({ title: '', dept: 'Technical', url: '', desc: '' });
        notify("Job posted successfully!", "success");
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Active Recruitments</h2>
                    <p className="text-sm text-gray-500">Manage organizational vacancies and incoming talent.</p>
                </div>
                {(role === 'Admin' || role === 'HR') && (
                    <button onClick={() => setIsPostModalOpen(true)} className="px-5 py-3 bg-brand text-brand-text rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-brand/20 active:scale-95 transition-all">
                        <FiPlus strokeWidth={4} /> Post New Job
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(job => (
                    <Card key={job.id} className="hover:border-brand transition-colors flex flex-col group">
                        <div className="flex justify-between items-start mb-6">
                            <Badge color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase">{job.department}</Badge>
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{job.applicants} Applied</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-8 flex-1 leading-tight group-hover:text-brand transition-colors">{job.title}</h3>
                        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-white/5">
                            <button 
                                onClick={() => setSelectedJob(job)}
                                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-md"
                            >
                                Review Applications
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* View Details Modal with Applicants */}
            <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title="Recruitment Dashboard">
                {selectedJob && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-inner">
                            <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                <FiBriefcase size={28} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-black text-xl text-gray-900 dark:text-white truncate">{selectedJob.title}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{selectedJob.department} • {selectedJob.status} POSITION</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Candidates</h4>
                                <Badge color="bg-gray-100 text-gray-500 font-bold">{MOCK_APPLICANTS.length} New</Badge>
                            </div>
                            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                                {MOCK_APPLICANTS.map((app, i) => (
                                    <div key={i} className="p-4 rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-darkcard hover:border-brand transition-all shadow-sm group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand transition-colors">
                                                    <FiUser size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm text-gray-900 dark:text-white">{app.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter flex items-center gap-1"><FiMail className="inline" /> {app.email}</p>
                                                </div>
                                            </div>
                                            <Badge color="bg-blue-50 text-blue-500 text-[8px] font-black uppercase">{app.source}</Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <a href="#" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-[10px] font-black text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 hover:border-brand transition-all">
                                                <FiFileText size={14} className="text-blue-500" /> RESUME.PDF
                                            </a>
                                            <a href={`https://${app.url}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-[10px] font-black text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 hover:border-brand transition-all">
                                                <FiGlobe size={14} className="text-purple-500" /> EXTERNAL URL
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                            <button onClick={() => setSelectedJob(null)} className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-500 font-black hover:text-brand transition-colors text-xs rounded-2xl uppercase tracking-widest shadow-inner">Minimize Dashboard</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Post Job Modal */}
            <Modal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} title="New Position Listing">
                <div className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Official Job Title</label>
                        <input 
                            type="text" 
                            className="w-full p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none focus:border-brand transition-all font-medium" 
                            placeholder="e.g. Senior Cloud Architect"
                            value={newJob.title}
                            onChange={e => setNewJob({...newJob, title: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Department</label>
                            <select 
                                className="w-full p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none appearance-none font-medium"
                                value={newJob.dept}
                                onChange={e => setNewJob({...newJob, dept: e.target.value})}
                            >
                                <option>Technical</option>
                                <option>Products</option>
                                <option>Administration</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Job Board URL</label>
                            <input 
                                type="text" 
                                className="w-full p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none focus:border-brand transition-all font-medium" 
                                placeholder="External Share Link"
                                value={newJob.url}
                                onChange={e => setNewJob({...newJob, url: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Role Summary</label>
                        <textarea 
                            className="w-full p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none focus:border-brand min-h-[100px] transition-all font-medium" 
                            placeholder="Describe primary goals and expectations..."
                            value={newJob.desc}
                            onChange={e => setNewJob({...newJob, desc: e.target.value})}
                        ></textarea>
                    </div>
                    <button 
                        onClick={handlePostJob}
                        className="w-full py-4 bg-brand text-brand-text font-black rounded-2xl shadow-xl mt-2 transform active:scale-[0.98] transition-all"
                    >
                        Publish Position Globally
                    </button>
                </div>
            </Modal>
        </div>
    );
};

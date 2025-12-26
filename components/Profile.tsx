
import React from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { Card } from './Shared';
import { Employee } from '../types';

export const ProfileView = ({ user }: { user: Employee }) => {
    if (!user) return null;
    return (
        <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
            <Card className="p-0 overflow-hidden shadow-xl">
                <div className="h-32 bg-gray-900 dark:bg-black w-full relative"></div>
                <div className="px-10 pb-10 relative">
                    <div className="flex flex-col md:flex-row items-end gap-6 -mt-12 mb-6"><div className="relative"><img src={user.avatar_url} className="w-32 h-32 rounded-[2rem] border-4 border-white dark:border-darkcard bg-gray-800 shadow-xl object-cover" alt="" /><div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-brand text-brand-text flex items-center justify-center border-4 border-white dark:border-darkcard"><FiEdit2 size={16} /></div></div><div className="flex-1"><h2 className="text-3xl font-black text-gray-900 dark:text-white">{user.name}</h2><p className="text-gray-500 font-bold">{user.position} • {user.department}</p></div><div className="flex gap-2"><button className="px-6 py-2.5 bg-brand text-brand-text rounded-xl font-bold text-sm shadow-lg shadow-brand/20">Edit Profile</button></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8"><div><h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">About Me</h3><p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Dedicated professional focused on delivering high-quality enterprise solutions.</p></div><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-bold text-gray-400 uppercase">Email</label><p className="text-sm font-bold">{user.email}</p></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Location</label><p className="text-sm font-bold">{user.location}</p></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Join Date</label><p className="text-sm font-bold">{user.join_date}</p></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Employee ID</label><p className="text-sm font-bold">{user.employee_id}</p></div></div></div>
                        <div className="space-y-6"><div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-center"><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Reward Points</p><h3 className="text-4xl font-black text-brand">{user.leaderboard_points}</h3></div></div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

import React from 'react';
import { FiTarget, FiAward } from 'react-icons/fi';
import { Card, Badge } from './Shared';
import { MOCK_GOALS } from '../constants';

export const Performance = () => {
    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><h3 className="font-bold text-lg mb-6 flex items-center gap-2"><FiTarget className="text-brand" /> Active Goals</h3><div className="space-y-6">{MOCK_GOALS.map(goal => (<div key={goal.id} className="space-y-2"><div className="flex justify-between items-center"><p className="font-bold text-sm">{goal.title}</p><Badge color={goal.status === 'On Track' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>{goal.status}</Badge></div><div className="w-full bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden"><div className="bg-brand h-full rounded-full" style={{ width: `${goal.progress}%` }}></div></div><div className="flex justify-between items-center"><span className="text-[10px] text-gray-500">Due {goal.dueDate}</span><span className="text-[10px] font-bold text-brand">{goal.progress}% Complete</span></div></div>))}</div></Card>
                <Card className="bg-gray-900 text-white flex flex-col items-center justify-center p-10 relative overflow-hidden"><FiAward size={64} className="text-brand mb-6" /><h3 className="text-xl font-bold mb-2">Annual Review</h3><p className="text-gray-400 text-sm mb-6">Next review: March 2025.</p><button className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl text-sm">Review Guidelines</button></Card>
            </div>
        </div>
    );
};
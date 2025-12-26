
import React, { useState, useEffect } from 'react';
import { FiPlus, FiMessageSquare, FiUser, FiSend, FiLifeBuoy } from 'react-icons/fi';
import { Card, Badge, Modal, CustomDropdown } from './Shared';
import { Ticket } from '../types';
import { api } from '../services/api';
import { CURRENT_USER_ID } from '../constants';

export const Helpdesk = ({ notify }: { notify: (msg: string, type: 'success' | 'error') => void }) => {
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTab, setActiveTab] = useState<'All' | 'My'>('All');
    
    const loadTickets = async () => {
        try {
            const data = await fetch('http://localhost:3001/tickets').then(r => r.json());
            setTickets(data);
        } catch (err) { notify("Sync failed", "error"); }
    };

    useEffect(() => { loadTickets(); }, []);

    const handleCreate = async (e: any) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await api.createTicket({
                employee_id: CURRENT_USER_ID,
                subject: fd.get('subject'),
                category: fd.get('category'),
                description: fd.get('description')
            });
            notify("Ticket created!", "success");
            setIsTicketModalOpen(false);
            loadTickets();
        } catch (err) { notify("Failed", "error"); }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Helpdesk</h2>
                    <p className="text-sm text-gray-500">Submit IT or HR queries.</p>
                </div>
                <button onClick={() => setIsTicketModalOpen(true)} className="px-4 py-2.5 bg-brand text-brand-text rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg">
                    <FiPlus /> New Ticket
                </button>
            </div>

            <Card noPadding={true}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-100 dark:border-white/5">
                            <tr>
                                <th className="p-4 pl-6">ID</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Created</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 pr-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {tickets.map(t => (
                                <tr key={t.ticket_id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 pl-6 font-mono text-xs text-gray-400">#{t.ticket_id}</td>
                                    <td className="p-4 font-bold">{t.subject}</td>
                                    <td className="p-4 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td className="p-4"><Badge color={t.status === 'Open' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>{t.status}</Badge></td>
                                    <td className="p-4 pr-6 text-right"><button onClick={() => setSelectedTicket(t)} className="text-brand text-xs font-bold hover:underline">View</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="New Support Request">
                <form onSubmit={handleCreate} className="space-y-4">
                    <input name="subject" required className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none" placeholder="Subject" />
                    <select name="category" className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none">
                        <option>IT Support</option>
                        <option>HR</option>
                        <option>Finance</option>
                    </select>
                    <textarea name="description" required className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none min-h-[100px]" placeholder="Explain your issue..." />
                    <button type="submit" className="w-full py-4 bg-brand text-brand-text font-black rounded-2xl">Submit Ticket</button>
                </form>
            </Modal>
        </div>
    );
};

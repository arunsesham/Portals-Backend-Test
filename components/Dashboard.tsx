
import React, { useState, useEffect } from 'react';
import { FiMapPin, FiClock, FiCheckCircle, FiPlus, FiLifeBuoy, FiTrash2, FiFileText, FiGrid, FiAward, FiTag, FiGift, FiUser, FiArrowRight, FiShield, FiExternalLink } from 'react-icons/fi';
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, Badge, Modal, DatePicker, CustomDropdown } from './Shared';
import { MiniCalendar } from './MiniCalendar';
import { Employee, DashboardPulse } from '../types';
import { api } from '../services/api';

export const Dashboard = ({ user, notify, onNavigate }: { user: Employee, notify: (msg: string, type: 'success' | 'error') => void, onNavigate: (view: string) => void }) => {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [pulse, setPulse] = useState<DashboardPulse>({
      birthdays: [],
      anniversaries: [],
      announcements: [],
      leaderboard: [],
      activity_graph: []
  });

  const [isLoading, setIsLoading] = useState(true);

  const loadPulse = async () => {
    try {
        const data = await api.getDashboardPulse();
        setPulse(data);
    } catch (err) {
        notify("Failed to sync dashboard", "error");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
      loadPulse();
  }, []);

  const handleDeleteAnnouncement = async (id: string) => {
      try {
          await api.deleteAnnouncement(id);
          notify("Announcement removed.", "success");
          loadPulse();
      } catch (err: any) {
          notify(err.message || "Delete failed", "error");
      }
  };

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [leaveType, setLeaveType] = useState('Sick');

  const checkInTime = user.location === 'Hyderabad' ? '02:05 PM' : '09:00 AM';
  const myRank = pulse.user_rankings?.find(r => r.employee_id === user.employee_id)?.rank || "N/A";

  const handleSubmitLeave = async () => {
      if(!fromDate || !toDate) return notify("Select dates.", "error");
      try {
          await api.applyLeave({
              employee_id: user.employee_id,
              start_date: fromDate,
              end_date: toDate,
              type: leaveType as any,
              reason: "Quick Dashboard Apply"
          });
          notify("Request submitted successfully!", "success");
          setIsLeaveModalOpen(false);
      } catch (err: any) { notify(err.message, "error"); }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Hello, {user.name.split(' ')[0]}! 👋</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">It's {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Badge color="bg-brand/10 dark:bg-brand/20 text-brand-text dark:text-brand border border-brand/20 px-4 py-2 font-black flex items-center gap-2">
            <FiMapPin /> {user.location} Office
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         <Card className="h-40 flex flex-col justify-between hover:shadow-lg transition-all border border-transparent hover:border-brand/30">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weekly Activity</p>
            <div className="h-16 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pulse.activity_graph}>
                        <Bar dataKey="hours" fill="#a3e635" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </Card>

         <Card className="h-40 flex flex-col justify-between hover:shadow-lg transition-all border border-transparent hover:border-brand/30">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Leave Balance</p>
            <p className="text-4xl font-black text-gray-900 dark:text-white">{user.leaves_remaining}</p>
            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">DAYS Available</span>
                <button onClick={() => setIsLeaveModalOpen(true)} className="w-8 h-8 rounded-full bg-brand text-brand-text flex items-center justify-center shadow-lg active:scale-90 transition-transform"><FiPlus strokeWidth={3}/></button>
            </div>
         </Card>

         <Card className="h-40 flex flex-col justify-between hover:shadow-lg transition-all border border-transparent hover:border-brand/30">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today's Shift</p>
            <div className="space-y-1">
                <p className="text-2xl font-black text-gray-900 dark:text-white">Active</p>
                <Badge color="bg-green-100 text-green-700 w-fit font-black">Logged: {checkInTime}</Badge>
            </div>
         </Card>

         <Card className="h-40 flex flex-col justify-between hover:shadow-lg transition-all border border-transparent hover:border-brand/30">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</p>
            <p className="text-3xl font-black text-yellow-500">#{myRank}</p>
            <Badge color="bg-yellow-100 text-yellow-700 w-fit font-black">{user.leaderboard_points} REWARD PTS</Badge>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
              <Card className="min-h-[450px]">
                  <h3 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4">Company News</h3>
                  <div className="space-y-6">
                      {pulse.announcements.map((ann) => (
                          <div key={ann.id} className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-brand/30 transition-all relative group">
                                  {(user.role === 'HR' || user.role === 'Admin') && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(ann.id); }}
                                        className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 transition-colors"
                                      >
                                          <FiTrash2 size={16} />
                                      </button>
                                  )}
                                  <div className="flex justify-between items-start mb-3">
                                      <Badge color={`bg-${ann.color || 'blue'}-100 text-${ann.color || 'blue'}-700 font-black text-[10px]`}>{ann.type}</Badge>
                                      <span className="text-xs font-bold text-gray-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <h4 className="font-black text-lg text-gray-900 dark:text-white">{ann.title}</h4>
                                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed font-medium">{ann.description}</p>
                          </div>
                      ))}
                      {pulse.announcements.length === 0 && <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No active announcements</div>}
                  </div>
              </Card>
          </div>

          <div className="lg:col-span-5 space-y-8">
              <Card className="p-8">
                  <MiniCalendar hideEvents={false} />
              </Card>

              <Card>
                  <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><FiAward className="text-yellow-500"/> Hall of Fame</h3>
                  <div className="space-y-5">
                      {pulse.leaderboard.map((emp, i) => (
                          <div key={emp.employee_id} className="flex items-center gap-4 group">
                              <span className="w-6 text-xs font-black text-gray-400 group-hover:text-brand transition-colors">0{i+1}</span>
                              <img src={emp.avatar || 'https://placehold.co/100'} className="w-10 h-10 rounded-2xl object-cover shadow-sm" />
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-gray-900 dark:text-white truncate">{emp.name}</p>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{emp.position}</p>
                              </div>
                              <span className="text-sm font-black text-brand">{emp.points}</span>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => onNavigate('directory')} className="w-full mt-6 py-2 text-[10px] font-black text-gray-400 hover:text-brand border-t border-gray-100 dark:border-white/5 uppercase tracking-widest transition-colors">View All Colleauges</button>
              </Card>
          </div>
      </div>

      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Fast Apply for Leave">
          <div className="space-y-4 overflow-visible">
              <div className="grid grid-cols-2 gap-4">
                  <div className="relative z-30"><DatePicker label="From" value={fromDate} onChange={setFromDate} /></div>
                  <div className="relative z-30"><DatePicker label="To" value={toDate} onChange={setToDate} minDate={fromDate}/></div>
              </div>
              <CustomDropdown options={['Sick', 'Vacation', 'Casual']} value={leaveType} onChange={setLeaveType} fullWidth={true} />
              <button onClick={handleSubmitLeave} className="w-full py-4 bg-brand text-brand-text font-black rounded-2xl shadow-xl hover:bg-brand-hover transition-all transform active:scale-[0.98]">Submit Application</button>
          </div>
      </Modal>
    </div>
  );
};

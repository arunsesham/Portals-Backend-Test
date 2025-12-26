
import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiFilter, FiTrash2, FiCalendar, FiSave } from 'react-icons/fi';
import { getDaysInMonth, getFirstDayOfMonth, isDateInRange } from '../utils';
import { Holiday, LeaveRequest } from '../types';
import { Modal, DatePicker, Card, CustomDropdown } from './Shared';
import { api } from '../services/api';

interface BigCalendarProps {
  leaves?: LeaveRequest[];
  holidays?: Holiday[];
  canManage?: boolean;
  notify?: (msg: string, type?: 'success' | 'error') => void;
}

export const BigCalendar = ({ 
    leaves = [], 
    holidays = [], 
    canManage = false,
    notify
}: BigCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeLocation, setActiveLocation] = useState('All');
  
  const [localHolidays, setLocalHolidays] = useState<Holiday[]>(holidays);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Partial<Holiday>>({ name: '', date: '', type: 'Public', locations: ['All'] });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1));

  const handleAddHoliday = async () => {
      if (!newHoliday.name || !newHoliday.date) {
          notify?.("Please enter both a name and date.", "error");
          return;
      }
      try {
          const result = await api.upsertHoliday(newHoliday);
          setLocalHolidays([...localHolidays, result]);
          setIsHolidayModalOpen(false);
          setNewHoliday({ name: '', date: '', type: 'Public', locations: ['All'] });
          notify?.("Holiday added to calendar successfully!", "success");
      } catch (err: any) {
          notify?.(err.message || "Failed to add holiday", "error");
      }
  };

  const filteredHolidays = localHolidays.filter(h => 
      activeLocation === 'All' || !h.locations || h.locations.includes(activeLocation) || h.locations.includes('All')
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 h-full flex flex-col">
       {/* Page Title */}
       <div className="flex justify-between items-center flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Holiday Calendar</h2>
       </div>

       {/* Calendar Card */}
       <Card className="flex flex-col p-6 w-full h-full overflow-visible" noPadding={true} allowOverflow={true}>
           {/* Top Controls */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
               <div>
                   <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                       {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                   </h3>
                   <p className="text-sm text-gray-500">Global Holiday Schedule</p>
               </div>
               
               <div className="flex items-center gap-3">
                    {/* ADD HOLIDAY BUTTON */}
                   {canManage && (
                       <button 
                           onClick={() => setIsHolidayModalOpen(true)}
                           className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                       >
                           <FiPlus strokeWidth={3} /> Add Holiday
                       </button>
                   )}
                   <div className="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white dark:hover:bg-white/20 rounded-lg shadow-sm transition-all text-gray-600 dark:text-gray-300"><FiChevronLeft size={20} /></button>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-white/20 rounded-lg shadow-sm transition-all text-gray-600 dark:text-gray-300"><FiChevronRight size={20} /></button>
                   </div>
               </div>
           </div>

           {/* Filters */}
           <div className="w-full mb-6 flex-shrink-0">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar w-full">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                        <FiFilter /> Filter:
                    </div>
                    {['All', 'US', 'India', 'UK'].map(loc => (
                        <button 
                            key={loc}
                            onClick={() => setActiveLocation(loc)}
                            className={`
                                px-4 py-1.5 rounded-lg text-sm font-bold transition-all border whitespace-nowrap
                                ${activeLocation === loc 
                                    ? 'bg-brand text-white border-brand shadow-md' 
                                    : 'bg-white dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border-gray-100 dark:border-white/10'}
                            `}
                        >
                            {loc}
                        </button>
                    ))}
                </div>
           </div>

           {/* Calendar Grid Headers */}
           <div className="grid grid-cols-7 text-center mb-2 flex-shrink-0 border-b border-gray-100 dark:border-white/5 pb-2">
               {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                   <div key={day} className="text-xs font-black text-gray-400 tracking-wider">{day}</div>
               ))}
           </div>
           
           {/* Calendar Grid Days */}
           <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-2 min-h-0">
               {Array.from({ length: firstDay }).map((_, i) => (
                   <div key={`empty-${i}`} className="p-1"></div>
               ))}
               
               {Array.from({ length: daysInMonth }).map((_, i) => {
                   const day = i + 1;
                   const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                   const isToday = new Date().toISOString().split('T')[0] === dateStr;
                   
                   const holiday = filteredHolidays.find(h => h.date === dateStr);

                   return (
                       <div 
                           key={day} 
                           className={`
                               flex flex-col items-start justify-start p-3 rounded-2xl border transition-all duration-300 ease-out
                               bg-white dark:bg-darkcard relative group cursor-default
                               ${isToday 
                                    ? 'bg-brand/5 border-brand ring-1 ring-brand/20' 
                                    : 'border-gray-100 dark:border-white/5'
                               }
                               hover:scale-125 hover:z-50 hover:shadow-2xl hover:border-brand/50
                           `}
                       >
                           <span className={`text-sm font-bold ${isToday ? 'text-brand' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>

                           {holiday && (
                               <div className="w-full h-full flex items-end justify-center pb-1">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 group-hover:hidden transition-opacity duration-200"></div>
                                    <div className="hidden group-hover:block w-full animate-scale-in">
                                        <div className="w-full px-1 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-[8px] font-bold border border-purple-100 dark:border-purple-800 text-center leading-tight shadow-sm">
                                            {holiday.locations && !holiday.locations.includes('All') ? `${holiday.locations.join(', ')}: ` : ''}{holiday.name}
                                        </div>
                                    </div>
                               </div>
                           )}
                       </div>
                   );
               })}
           </div>

           {/* Legend */}
           <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex-shrink-0">
               <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Holiday</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white border border-brand ring-1 ring-brand/20"></div> Today</div>
               </div>
           </div>
       </Card>

       {/* Add Holiday Modal */}
       <Modal isOpen={isHolidayModalOpen} onClose={() => setIsHolidayModalOpen(false)} title="Add New Holiday">
            <div className="space-y-4 overflow-visible">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Holiday Name</label>
                    <input 
                        type="text" 
                        value={newHoliday.name} 
                        onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:border-brand transition-all text-sm font-medium" 
                        placeholder="e.g. New Year's Day"
                    />
                </div>
                <div className="relative z-20">
                    <DatePicker 
                        label="Date"
                        value={newHoliday.date || ''}
                        onChange={(date) => setNewHoliday({...newHoliday, date})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative z-10">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Type</label>
                        <CustomDropdown 
                            options={['Public', 'Optional']}
                            value={newHoliday.type || 'Public'}
                            onChange={(val) => setNewHoliday({...newHoliday, type: val as any})}
                            fullWidth={true}
                        />
                    </div>
                    <div className="relative z-10">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Location</label>
                        <CustomDropdown 
                            options={['All', 'US', 'UK', 'India', 'Hyderabad', 'Chicago']}
                            value={newHoliday.locations?.[0] || 'All'}
                            onChange={(val) => setNewHoliday({...newHoliday, locations: val === 'All' ? ['All', 'US', 'UK', 'India'] : [val]})}
                            fullWidth={true}
                        />
                    </div>
                </div>
                <div className="pt-2">
                    <button onClick={handleAddHoliday} className="w-full py-4 bg-brand text-brand-text font-black rounded-2xl hover:bg-brand-hover transition-all flex items-center justify-center gap-2 shadow-lg">
                        <FiSave size={18} /> Save Holiday Record
                    </button>
                </div>
            </div>
       </Modal>
    </div>
  );
};

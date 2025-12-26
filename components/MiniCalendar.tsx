
import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiUmbrella, FiGift, FiAward } from 'react-icons/fi';
import { getDaysInMonth, getFirstDayOfMonth, isDateInRange } from '../utils';
import { Employee, Holiday, LeaveRequest } from '../types';

interface MiniCalendarProps {
  leaves?: LeaveRequest[];
  holidays?: Holiday[]; // Kept in interface but ignored in logic if needed, or removed from usage
  employees?: Employee[];
  onDateClick?: (date: string) => void;
  selectedDate?: string;
  enableSelection?: boolean;
  minDate?: string;
  hideEvents?: boolean;
}

export const MiniCalendar = ({ 
    leaves = [], 
    employees = [],
    onDateClick, 
    selectedDate,
    enableSelection = true, 
    minDate,
    hideEvents = false
}: MiniCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState<string>(selectedDate || new Date().toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  useEffect(() => {
      if (selectedDate) {
          setInternalSelectedDate(selectedDate);
      }
  }, [selectedDate]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1));

  const handleDayClick = (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (minDate && dateStr < minDate) return;

      setInternalSelectedDate(dateStr);
      if (onDateClick) {
          onDateClick(dateStr);
      }
  };

  const upcomingLeaves = React.useMemo(() => {
      return leaves.filter(l => {
        const d = new Date(l.start_date);
        return d.getMonth() === month && d.getFullYear() === year;
      }).sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [leaves, month, year]);

  const upcomingBirthdays = React.useMemo(() => {
      return employees?.filter(e => {
          const d = new Date(e.dob);
          return d.getMonth() === month;
      }).map(e => ({ ...e, date: new Date(e.dob).setFullYear(year) }))
      .sort((a,b) => new Date(a.date).getDate() - new Date(b.date).getDate());
  }, [month, year, employees]);

  const upcomingAnniversaries = React.useMemo(() => {
      return employees?.filter(e => {
          const d = new Date(e.join_date);
          return d.getMonth() === month;
      }).map(e => {
          const joinDate = new Date(e.join_date);
          const years = year - joinDate.getFullYear();
          return { ...e, years, date: joinDate.setFullYear(year) };
      }).sort((a,b) => new Date(a.date).getDate() - new Date(b.date).getDate());
  }, [month, year, employees]);

  return (
    <div className="flex flex-col w-full">
       {/* Header */}
       <div className="flex justify-between items-center mb-4">
           <h3 className="text-base font-bold text-gray-900 dark:text-white">
               {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
           </h3>
           <div className="flex items-center gap-1">
               <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><FiChevronLeft size={18} /></button>
               <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><FiChevronRight size={18} /></button>
           </div>
       </div>

       {/* Grid Headers */}
       <div className="grid grid-cols-7 text-center mb-2">
           {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
               <div key={day} className="text-xs font-black text-gray-400">{day}</div>
           ))}
       </div>
       
       {/* Days */}
       <div className="grid grid-cols-7 gap-1">
           {Array.from({ length: firstDay }).map((_, i) => (
               <div key={`empty-${i}`} className="p-1"></div>
           ))}
           
           {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
               const isToday = new Date().toISOString().split('T')[0] === dateStr;
               const isSelected = internalSelectedDate === dateStr;
               const isDisabled = minDate ? dateStr < minDate : false;
               
               // Logic to check for events on this day
               const hasLeave = upcomingLeaves.some(l => new Date(l.start_date).getDate() === day);
               const hasBirthday = upcomingBirthdays.some(b => new Date(b.date).getDate() === day);
               const hasAnniversary = upcomingAnniversaries.some(a => new Date(a.date).getDate() === day);

               return (
                   <div 
                       key={day} 
                       onClick={() => !isDisabled && handleDayClick(day)}
                       className={`
                           relative flex flex-col items-center justify-center h-8 w-8 rounded-full text-xs transition-all mx-auto
                           ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                           ${isSelected ? 'bg-brand text-white font-bold shadow-md' : ''}
                           ${!isSelected && isToday ? 'bg-gray-100 dark:bg-white/10 text-brand font-bold' : ''}
                           ${!isSelected && !isToday ? 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300' : ''}
                       `}
                   >
                       <span>{day}</span>
                       
                       {/* Event Indicators (Dots) */}
                       <div className="flex gap-0.5 absolute bottom-1">
                           {hasLeave && <div className="w-1 h-1 rounded-full bg-red-500"></div>}
                           {hasBirthday && <div className="w-1 h-1 rounded-full bg-pink-500"></div>}
                           {hasAnniversary && <div className="w-1 h-1 rounded-full bg-blue-500"></div>}
                       </div>
                   </div>
               );
           })}
       </div>

        {/* Events List */}
        {!hideEvents && (
            <div className="w-full mt-4 pt-4 border-t border-gray-100 dark:border-white/5 overflow-y-auto max-h-[300px] space-y-5 pr-1 custom-scrollbar">
                
                {/* Leaves */}
                {upcomingLeaves.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Leaves</h4>
                        <div className="space-y-3">
                            {upcomingLeaves.map((leave, i) => {
                                 const emp = employees.find(e => e.employee_id === leave.employee_id);
                                 return (
                                    <div key={i} className="flex items-start gap-3 group">
                                        <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 flex items-center justify-center shrink-0">
                                            <FiUmbrella size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{emp?.name || 'Unknown'}</p>
                                            <p className="text-[10px] text-gray-500">{leave.type} • {new Date(leave.start_date).getDate()}-{new Date(leave.end_date).getDate()} {new Date(leave.start_date).toLocaleString('default', { month: 'short' })}</p>
                                        </div>
                                    </div>
                                 )
                            })}
                        </div>
                    </div>
                )}

                {/* Birthdays */}
                {upcomingBirthdays.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Birthdays</h4>
                        <div className="space-y-3">
                            {upcomingBirthdays.map((evt, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 dark:bg-pink-900/20 dark:text-pink-400 flex items-center justify-center shrink-0">
                                        <FiGift size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{evt.name}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(evt.date).getDate()} {new Date(evt.date).toLocaleString('default', { month: 'short' })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Anniversaries */}
                {upcomingAnniversaries.length > 0 && (
                     <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Anniversaries</h4>
                        <div className="space-y-3">
                            {upcomingAnniversaries.map((evt, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <FiAward size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{evt.name}</p>
                                        <p className="text-[10px] text-gray-500">{evt.years} Year{evt.years > 1 ? 's' : ''} • {new Date(evt.date).getDate()} {new Date(evt.date).toLocaleString('default', { month: 'short' })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {upcomingLeaves.length === 0 && upcomingBirthdays.length === 0 && upcomingAnniversaries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <p className="text-xs italic">No events this month.</p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};


import React, { useState } from 'react';
import { Card, DatePicker, CustomDropdown } from './Shared';
import { MOCK_EMPLOYEES, CURRENT_USER_ID } from '../constants';
import { FiClock, FiCheckCircle, FiBriefcase } from 'react-icons/fi';

// --- Attendance Module ---
// This page tracks when employees start and end their workday.
// It shows three tabs:
// 1. Overview: A big clock showing the current time and if they are checked in.
// 2. History: A list of past days and how many hours they worked.
// 3. Requests: A form to fix mistakes (like forgetting to punch out).

export const Attendance = ({ notify }: { notify: (msg: string, type: 'success' | 'error') => void }) => {
    const [tab, setTab] = useState<'overview' | 'history' | 'requests'>('overview');
    const [requestType, setRequestType] = useState<'regularization' | 'compoff'>('regularization');
    const [workMode, setWorkMode] = useState<'Office' | 'Home'>('Office');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mock getting current user location logic
    const currentUser = MOCK_EMPLOYEES.find(e => e.employee_id === CURRENT_USER_ID) || MOCK_EMPLOYEES[0];
    const isHyderabad = currentUser.location === 'Hyderabad';
    
    // Shift logic based on location
    const shiftStart = isHyderabad ? '02:00 PM' : '09:00 AM';
    const shiftEnd = isHyderabad ? '11:00 PM' : '06:00 PM';
    const checkInTime = isHyderabad ? '02:05 PM' : '09:00 AM'; // Mock

    const handleSubmitRequest = () => {
        if (!fromDate || !toDate) {
            notify("Please select dates for the request.", "error");
            return;
        }
        notify(`${requestType === 'regularization' ? 'Regularization' : 'Comp-Off'} request submitted successfully!`, "success");
        setFromDate('');
        setToDate('');
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
           <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h2>
                <div className="flex bg-white dark:bg-darkcard p-1 rounded-xl border border-gray-200 dark:border-transparent">
                    <button onClick={() => setTab('overview')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'overview' ? 'bg-brand text-brand-text shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>Overview</button>
                    <button onClick={() => setTab('history')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'history' ? 'bg-brand text-brand-text shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>History</button>
                    <button onClick={() => setTab('requests')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'requests' ? 'bg-brand text-brand-text shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>Requests</button>
                </div>
           </div>

           {/* --- Tab 1: Overview (The Clock) --- */}
           {tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="flex flex-col items-center justify-center p-10 text-center space-y-6 min-h-[300px]">
                        <div className="w-20 h-20 rounded-full bg-brand/10 text-brand-text dark:text-brand flex items-center justify-center mb-2">
                             <FiClock size={40} />
                        </div>
                        <div className="space-y-2">
                             <p className="text-sm text-gray-500 uppercase tracking-wider font-bold">Current Time</p>
                             <h1 className="text-6xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">{time}</h1>
                             <p className="text-gray-400 font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </Card>

                    <Card className="flex flex-col justify-center min-h-[300px]">
                         <div className="flex items-center gap-3 mb-8">
                             <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white">
                                 <FiCheckCircle size={20} />
                             </div>
                             <div>
                                 <h3 className="font-bold text-lg text-gray-900 dark:text-white">Today's Activity</h3>
                                 <p className="text-xs text-gray-500">{currentUser.location} Office</p>
                             </div>
                         </div>
                         
                         <div className="relative border-l-2 border-dashed border-gray-200 dark:border-white/10 ml-5 space-y-10 py-2">
                             <div className="ml-8 relative">
                                <span className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-green-500 border-4 border-white dark:border-darkcard shadow-sm z-10"></span>
                                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">Check In</p>
                                        <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded">{checkInTime}</span>
                                    </div>
                                    <p className="text-xs text-gray-500"> biometric_scan_01 • Main Entrance</p>
                                </div>
                            </div>
                             <div className="ml-8 relative">
                                <span className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-4 border-white dark:border-darkcard shadow-sm z-10"></span>
                                <div className="opacity-60">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">Shift End (Expected)</p>
                                    <p className="text-xs text-gray-500">{shiftEnd}</p>
                                </div>
                            </div>
                         </div>
                    </Card>
                </div>
           )}

           {/* --- Tab 2: History (The List) --- */}
           {tab === 'history' && (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase text-gray-500 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                <tr>
                                    <th className="p-4 rounded-tl-xl">Date</th>
                                    <th className="p-4">Check In</th>
                                    <th className="p-4">Check Out</th>
                                    <th className="p-4">Total Hrs</th>
                                    <th className="p-4 rounded-tr-xl">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {[1,2,3,4,5].map((i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">Nov {20-i}, 2023</td>
                                        <td className="p-4 font-mono text-gray-600 dark:text-gray-300">{checkInTime.replace('05', '0'+i)}</td>
                                        <td className="p-4 font-mono text-gray-600 dark:text-gray-300">{shiftEnd}</td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">9h 0m</td>
                                        <td className="p-4"><span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200 dark:border-transparent">PRESENT</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
           )}

           {/* --- Tab 3: Requests (The Fix-it Form) --- */}
           {/* REDESIGNED: Full width layout to fill the screen as requested */}
           {tab === 'requests' && (
             <Card allowOverflow={true} className="min-h-[500px]">
                 <div className="max-w-4xl mx-auto space-y-8 py-4">
                     
                     <div className="space-y-6">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Request Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setRequestType('regularization')}
                                    className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-bold text-sm transition-all ${requestType === 'regularization' ? 'border-brand bg-brand/5 text-gray-900 dark:text-white ring-1 ring-brand/20' : 'border-gray-100 dark:border-white/10 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${requestType === 'regularization' ? 'border-brand' : 'border-gray-300'}`}>
                                        {requestType === 'regularization' && <span className="w-2 h-2 rounded-full bg-brand"></span>}
                                    </span>
                                    Regularization
                                </button>
                                <button 
                                    onClick={() => setRequestType('compoff')}
                                    className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-bold text-sm transition-all ${requestType === 'compoff' ? 'border-brand bg-brand/5 text-gray-900 dark:text-white ring-1 ring-brand/20' : 'border-gray-100 dark:border-white/10 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${requestType === 'compoff' ? 'border-brand' : 'border-gray-300'}`}>
                                        {requestType === 'compoff' && <span className="w-2 h-2 rounded-full bg-brand"></span>}
                                    </span>
                                    Comp-Off
                                </button>
                            </div>
                         </div>

                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Work Mode</label>
                            {/* Updated Custom Dropdown */}
                            <CustomDropdown 
                                options={['Work from Office', 'Work from Home']}
                                value={workMode === 'Office' ? 'Work from Office' : 'Work from Home'}
                                onChange={(val) => setWorkMode(val === 'Work from Office' ? 'Office' : 'Home')}
                                fullWidth={true}
                                icon={FiBriefcase}
                            />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="relative z-30">
                                <DatePicker 
                                    label="From Date" 
                                    value={fromDate} 
                                    onChange={setFromDate} 
                                />
                             </div>
                             <div className="relative z-30">
                                <DatePicker 
                                    label="To Date" 
                                    value={toDate} 
                                    onChange={setToDate} 
                                    minDate={fromDate} 
                                />
                             </div>
                         </div>
                         
                         <div className="relative z-10">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason for Request</label>
                            <textarea 
                                className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 outline-none focus:border-brand focus:ring-1 focus:ring-brand min-h-[120px] transition-all" 
                                placeholder="Please provide a detailed reason for the discrepancy..."
                            ></textarea>
                         </div>

                         <div className="pt-4">
                             <button onClick={handleSubmitRequest} className="w-full bg-brand text-brand-text font-bold py-4 rounded-xl hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/20 transition-all transform active:scale-[0.99]">
                                 Submit {requestType === 'regularization' ? 'Regularization' : 'Comp-Off'} Request
                             </button>
                         </div>
                     </div>
                 </div>
             </Card>
           )}
        </div>
    );
};

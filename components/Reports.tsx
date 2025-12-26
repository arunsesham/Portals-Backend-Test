
import React, { useState } from 'react';
import { FiDownload, FiUser, FiCalendar, FiFilter, FiCheckCircle, FiLock } from 'react-icons/fi';
import { RiCalendarScheduleLine } from 'react-icons/ri';
import { TbReport } from 'react-icons/tb';
import { Card, Badge, DatePicker, CustomDropdown } from './Shared';
import { MOCK_EMPLOYEES } from '../constants';
import { api } from '../services/api';

// Fix: Update notify prop type signature to make 'type' parameter optional to match App.tsx definition
interface ReportsProps {
    userRole: string;
    notify: (msg: string, type?: 'success' | 'error') => void;
}

export const Reports: React.FC<ReportsProps> = ({ userRole, notify }) => {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('All Employees');
    const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV'>('PDF');
    const [isGenerating, setIsGenerating] = useState(false);

    // Role restriction check
    const authorizedRoles = ['Admin', 'Accounting', 'Manager', 'Lead'];
    const isAuthorized = authorizedRoles.includes(userRole);

    const employeeOptions = ['All Employees', ...MOCK_EMPLOYEES.map(e => e.name)];

    const handleGenerate = async (reportName: string) => {
        if (!fromDate || !toDate) {
            notify("Please select a valid date range.", "error");
            return;
        }
        
        setIsGenerating(true);
        notify(`Generating ${reportName} in ${exportFormat} format...`, "success");
        
        try {
            const result = await api.generateReport({
                reportType: reportName.includes("Attendance") ? "Attendance" : "Leave",
                fromDate,
                toDate,
                employeeId: selectedEmployee,
                format: exportFormat
            });
            
            notify(`${reportName} extracted successfully!`, "success");
            // Simulate triggering a download
            window.open(result.downloadUrl, '_blank');
        } catch (err: any) {
            notify(err.message || "Failed to generate report.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center mb-6 shadow-sm border border-red-100 dark:border-red-900/10">
                    <FiLock size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h3>
                <p className="text-gray-500 dark:text-gray-400 max-md">
                    The reporting engine is only available to authorized roles (Admin, Accounting, Managers, and Leads). Please contact HR for access requests.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <TbReport className="text-brand" size={32} /> Organizational Reports
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Configure and export enterprise data for analysis.</p>
                </div>
                <Badge color="bg-brand/10 text-brand-text font-bold px-4 py-2">
                    Active Session: {userRole}
                </Badge>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Configuration Sidebar */}
                <Card className="xl:col-span-1 space-y-8 h-fit shadow-xl border-gray-200 dark:border-white/5 overflow-visible">
                    <div className="flex items-center gap-2 font-bold text-gray-400 uppercase tracking-widest text-xs">
                        <FiFilter /> Report Filters
                    </div>

                    <div className="space-y-6">
                        <DatePicker label="From Date" value={fromDate} onChange={setFromDate} />
                        <DatePicker label="To Date" value={toDate} onChange={setToDate} minDate={fromDate} />
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Employee</label>
                            <CustomDropdown 
                                options={employeeOptions}
                                value={selectedEmployee}
                                onChange={setSelectedEmployee}
                                fullWidth={true}
                                icon={FiUser}
                            />
                        </div>

                        <div className="pt-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3 text-center">Export Format</label>
                            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
                                <button 
                                    onClick={() => setExportFormat('PDF')}
                                    className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${exportFormat === 'PDF' ? 'bg-white dark:bg-darkcard shadow-lg text-gray-900 dark:text-white border border-gray-100 dark:border-white/5' : 'text-gray-400'}`}
                                >
                                    PDF
                                </button>
                                <button 
                                    onClick={() => setExportFormat('CSV')}
                                    className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${exportFormat === 'CSV' ? 'bg-white dark:bg-darkcard shadow-lg text-gray-900 dark:text-white border border-gray-100 dark:border-white/5' : 'text-gray-400'}`}
                                >
                                    CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Main Content Areas */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Attendance Report Card */}
                    <Card className="flex flex-col p-8 group hover:border-brand transition-all cursor-default h-fit">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-6 shadow-sm">
                            <RiCalendarScheduleLine size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Attendance Summary</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                            Generate a comprehensive detailed view of check-in times, shift adherence, total hours worked, and late marks.
                        </p>
                        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
                            <button 
                                onClick={() => handleGenerate("Attendance Report")}
                                disabled={isGenerating}
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                <FiDownload strokeWidth={3} /> {isGenerating ? 'Processing...' : 'Generate Report'}
                            </button>
                        </div>
                    </Card>

                    {/* Leave & Comp-Off Report Card */}
                    <Card className="flex flex-col p-8 group hover:border-brand transition-all cursor-default h-fit">
                        <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center mb-6 shadow-sm">
                            <FiCheckCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Leave & Balance Audit</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                            Audit of all approved and pending leave requests, comp-off earnings, and current remaining balances for employee leave types.
                        </p>
                        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
                            <button 
                                onClick={() => handleGenerate("Leave & Balance Audit")}
                                disabled={isGenerating}
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                <FiDownload strokeWidth={3} /> {isGenerating ? 'Processing...' : 'Generate Audit'}
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

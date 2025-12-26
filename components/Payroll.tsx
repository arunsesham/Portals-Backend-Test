
import React, { useState } from 'react';
import { FiFileText, FiDownload, FiSearch, FiCalendar } from 'react-icons/fi';
import { Card, Badge, CustomDropdown } from './Shared';
import { api } from '../services/api';
import { PayrollDocument } from '../types';

export const Payroll = ({ notify }: { notify: (msg: string, type: 'success' | 'error') => void }) => {
    const [selectedMonth, setSelectedMonth] = useState('October');
    const [selectedYear, setSelectedYear] = useState(2025);
    const [fetchedSlip, setFetchedSlip] = useState<PayrollDocument | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const years = [2025, 2024, 2023];

    const handleFetch = async () => {
        setIsFetching(true);
        setFetchedSlip(null);
        try {
            // In real app, we fetch all and filter by selected period
            const slips = await api.getPayslips("400");
            const match = slips.find(s => s.month === selectedMonth && s.year === selectedYear);
            
            if (match) {
                setFetchedSlip(match);
                notify("Payslip retrieved successfully from S3 storage.", "success");
            } else {
                notify("No payslip record found for this period.", "error");
            }
        } catch (err: any) {
            notify(err.message || "Failed to retrieve payslip.", "error");
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll Services</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payslip Downloader Card - Fixed overflow for dropdown */}
                <Card className="lg:col-span-1 space-y-6 overflow-visible" allowOverflow={true}>
                    <h3 className="font-bold text-lg">Download Payslip</h3>
                    <p className="text-sm text-gray-500">Select the period to retrieve your detailed digital payslip.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Month</label>
                            <CustomDropdown 
                                options={months} 
                                value={selectedMonth} 
                                onChange={setSelectedMonth} 
                                fullWidth={true} 
                                icon={FiCalendar}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Year</label>
                            <CustomDropdown 
                                options={years} 
                                value={selectedYear} 
                                onChange={setSelectedYear} 
                                fullWidth={true} 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleFetch}
                        disabled={isFetching}
                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isFetching ? <div className="w-5 h-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></div> : <FiDownload strokeWidth={3} />}
                        {isFetching ? 'Fetching...' : 'Fetch Payslip PDF'}
                    </button>
                </Card>

                {/* Payslip Result Area - Removed Status and Reference */}
                <Card className="lg:col-span-2 flex flex-col justify-center items-center min-h-[400px]">
                    {fetchedSlip ? (
                        <div className="w-full max-w-md animate-scale-in">
                            <div className="text-center mb-8">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-brand/10 text-brand flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <FiFileText size={48} />
                                </div>
                                <h4 className="text-2xl font-black text-gray-900 dark:text-white">Payslip Statement</h4>
                                <p className="text-gray-500 font-medium mt-1 uppercase tracking-widest text-[10px]">{fetchedSlip.month} {fetchedSlip.year}</p>
                            </div>
                            
                            <div className="p-8 rounded-3xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex flex-col items-center">
                                <button 
                                    onClick={() => window.open(fetchedSlip.url, '_blank')}
                                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    <FiDownload size={20} /> Download PDF Statement
                                </button>
                                <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest">Digitally Verified by Finance Dept.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 max-w-xs">
                             <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 text-gray-300 flex items-center justify-center mx-auto border-2 border-dashed border-gray-200 dark:border-white/10">
                                 <FiSearch size={32} />
                             </div>
                             <h4 className="text-gray-400 font-bold uppercase tracking-widest text-xs">Awaiting Period Selection</h4>
                             <p className="text-sm text-gray-500">Please select a month and year to retrieve your payslip data for viewing.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

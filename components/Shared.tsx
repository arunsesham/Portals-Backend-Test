
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiCalendar, FiCheckCircle, FiAlertCircle, FiChevronDown } from 'react-icons/fi';
import { MiniCalendar } from './MiniCalendar';

// --- Toast Notification System ---
export interface ToastMessage {
    id: number;
    type: 'success' | 'error';
    message: string;
}

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`
                        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-in
                        ${toast.type === 'success' ? 'bg-white dark:bg-darkcard border-green-500 text-gray-900 dark:text-white' : 'bg-white dark:bg-darkcard border-red-500 text-gray-900 dark:text-white'}
                    `}
                    style={{ minWidth: '300px' }}
                >
                    <div className={`p-1 rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm">{toast.type === 'success' ? 'Success' : 'Error'}</p>
                        <p className="text-xs text-gray-500">{toast.message}</p>
                    </div>
                    <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><FiX /></button>
                </div>
            ))}
        </div>
    );
};

// --- Reusable UI Blocks ---
export interface CardProps {
    children?: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    allowOverflow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "", noPadding = false, allowOverflow = false }) => (
  <div className={`
    bg-white dark:bg-darkcard rounded-3xl shadow-sm border border-gray-100 dark:border-transparent 
    ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'} 
    ${noPadding ? '' : 'p-6'} 
    ${className}
  `}>
    {children}
  </div>
);

export const Badge: React.FC<{ children?: React.ReactNode; color?: string }> = ({ children, color = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" }) => (
  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${color}`}>
    {children}
  </span>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-darkcard w-full max-w-lg rounded-3xl shadow-2xl overflow-visible border border-gray-100 dark:border-white/10 flex flex-col relative animate-scale-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5 rounded-t-3xl">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"><FiX /></button>
                </div>
                <div className="p-6 rounded-b-3xl bg-white dark:bg-darkcard">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Custom Date Picker ---
export interface DatePickerProps {
    label: string;
    value: string;
    onChange: (date: string) => void;
    minDate?: string;
}

export const DatePicker = ({ label, value, onChange, minDate }: DatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateSelect = (date: string) => {
        onChange(date);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full p-3 bg-gray-50 dark:bg-white/5 rounded-xl border flex items-center justify-between cursor-pointer transition-all
                    ${isOpen ? 'border-brand ring-2 ring-brand/10' : 'border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'}
                `}
            >
                <span className={`text-sm font-medium ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select Date'}
                </span>
                <FiCalendar className="text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-[280px] bg-white dark:bg-[#27272a] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-3 animate-fade-in">
                    <MiniCalendar 
                        enableSelection={true}
                        selectedDate={value}
                        onDateClick={handleDateSelect}
                        minDate={minDate}
                        hideEvents={true} 
                    />
                </div>
            )}
        </div>
    );
};

// --- Custom Dropdown Component ---
export const CustomDropdown = ({ options, value, onChange, icon: Icon, type = 'text', fullWidth = false }: { options: (string|number)[], value: string|number, onChange: (val: any) => void, icon?: any, type?: 'text'|'number', fullWidth?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-darkcard border transition-all
                    ${isOpen ? 'border-brand ring-1 ring-brand/20 shadow-md' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}
                    ${fullWidth ? 'w-full' : 'min-w-[140px]'}
                `}
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon className={`text-gray-400 transition-colors ${isOpen ? 'text-brand' : ''}`} />}
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
                </div>
                {!Icon && <FiChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-brand' : ''}`} />}
                {Icon && <FiChevronDown className={`text-gray-400 ml-auto transition-transform ${isOpen ? 'rotate-180 text-brand' : ''}`} />}
            </button>

            {isOpen && (
                <div className={`absolute top-full left-0 mt-2 bg-white dark:bg-darkcard rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 animate-fade-in max-h-[300px] overflow-y-auto ${fullWidth ? 'w-full' : 'w-[160px] right-0'}`}>
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors border-b border-gray-50 dark:border-white/5 last:border-0
                                ${value === opt 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}
                            `}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

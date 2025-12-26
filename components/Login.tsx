
import React, { useState, useRef } from 'react';
import { FiUser, FiBriefcase, FiShield, FiSmartphone, FiArrowRight, FiUsers, FiMail, FiLock } from 'react-icons/fi';

// --- The Login Page ---
// This is the gatekeeper. Users log in with their email.
// Redesigned with branding on the image side and the official logo on the form side.

export const LoginPage = ({ onLogin }: { onLogin: (email: string, pass: string) => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate a small delay for better UX
        setTimeout(() => {
            onLogin(email, password);
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen w-full flex font-sans overflow-hidden bg-white dark:bg-darkbg">
            {/* Left Side - Visuals (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 flex-col justify-end p-20">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                        backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")',
                        filter: 'grayscale(100%) brightness(0.5) contrast(1.1)' 
                    }}
                ></div>
                
                <div className="relative z-10 max-w-2xl">
                     <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">
                        Portals Pro<span className="text-brand">.</span>
                     </h1>
                     <p className="text-xl text-slate-300 leading-relaxed font-light">
                        Unified platform for Employee and HR management.
                     </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-24 relative bg-white dark:bg-darkbg">
                <div className="w-full max-w-[400px]">
                    <div className="mb-12 text-center lg:text-left">
                        {/* Logo Container */}
                        <div className="w-20 h-20 bg-white dark:bg-darkcard rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center mb-8 mx-auto lg:mx-0">
                            <img 
                                src="https://cdn.prod.website-files.com/66d6b6395835bed75848a0c8/67179fa63247ccb8c4e04805_portalspro.png" 
                                alt="Portals Pro Logo" 
                                className="w-12 h-12 object-contain" 
                            />
                        </div>
                        
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Welcome back</h2>
                        <p className="text-slate-500 dark:text-slate-400">Please enter your work email to sign in.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-900 dark:text-white">Work Email</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com" 
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-darkcard border border-slate-200 dark:border-white/10 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-slate-900 dark:text-white transition-all placeholder:text-slate-400 shadow-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-slate-900 dark:text-white">Password</label>
                                <a href="#" className="text-sm font-semibold text-brand hover:underline">Forgot?</a>
                            </div>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••" 
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-darkcard border border-slate-200 dark:border-white/10 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-slate-900 dark:text-white transition-all placeholder:text-slate-400 shadow-sm"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? 'Verifying...' : <>Sign In <FiArrowRight strokeWidth={3} /></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Multi-Factor Authentication (MFA) Page ---
export const MfaPage = ({ onVerify, isSetup = false }: { onVerify: () => void, isSetup?: boolean }) => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleInputChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-darkbg flex flex-col items-center justify-center p-6 font-sans">
             <div className="w-full max-w-md bg-white dark:bg-darkcard p-10 text-center rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 animate-scale-in relative overflow-hidden">
                 
                 <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100 dark:border-white/5">
                     <FiSmartphone size={32} />
                 </div>
                 
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                     {isSetup ? 'Setup Authenticator' : 'Two-Factor Authentication'}
                 </h2>
                 <p className="text-slate-500 mb-8 text-sm">
                     {isSetup 
                        ? 'Scan the QR code below with your authenticator app.'
                        : 'Enter the 6-digit code from your authenticator app.'
                     }
                 </p>

                 {isSetup && (
                     <div className="mb-8 p-4 border border-slate-200 rounded-3xl inline-block bg-white">
                         <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/Portals:User?secret=JBSWY3DPEHPK3PXP&issuer=Portals`} 
                            alt="QR Code" 
                            className="w-32 h-32"
                         />
                     </div>
                 )}

                 <div className="flex gap-2.5 justify-center mb-8">
                     {code.map((digit, idx) => (
                         <input
                            key={idx}
                            ref={el => { inputRefs.current[idx] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleInputChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className="w-11 h-14 text-center text-xl font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all shadow-sm"
                         />
                     ))}
                 </div>

                 <button 
                    onClick={onVerify}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg mb-6 uppercase tracking-widest text-xs"
                 >
                     {isSetup ? 'Verify & Setup' : 'Verify Identity'}
                 </button>

                 <button className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                     Having trouble? Contact Support
                 </button>
             </div>
        </div>
    );
};

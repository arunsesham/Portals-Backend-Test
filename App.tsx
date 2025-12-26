
import React, { useState, useEffect, useRef } from 'react';
import { 
  FiHome, FiUsers, FiCalendar, FiCheckCircle, FiFileText, 
  FiSun, FiMoon, FiBell, FiLogOut, FiUser, 
  FiFolder, FiTarget, FiClipboard, FiBriefcase, FiShare2, FiUmbrella,
  FiSettings, FiUserPlus, FiFlag, FiSearch
} from 'react-icons/fi';
import { BiSupport } from 'react-icons/bi';
import { RiCalendarScheduleLine } from 'react-icons/ri';
import { TbReport } from 'react-icons/tb';

import { MOCK_HOLIDAYS, MOCK_LEAVES } from './constants';
import { Card, Badge, ToastContainer, ToastMessage } from './components/Shared';
import { BigCalendar } from './components/BigCalendar';
import { LoginPage, MfaPage } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Leaves } from './components/Leaves';
import { Attendance } from './components/Attendance';
import { Directory } from './components/Directory';
import { Documents } from './components/Documents';
import { Helpdesk } from './components/Helpdesk';
import { Payroll } from './components/Payroll';
import { Performance } from './components/Performance';
import { Recruitment } from './components/Recruitment';
import { Referrals } from './components/Referrals';
import { Onboarding } from './components/Onboarding';
import { ProfileView } from './components/Profile';
import { Approvals } from './components/Approvals';
import { Reports } from './components/Reports';
import { AdminConfig } from './components/AdminConfig';
import { Employee } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<'login' | 'mfa_setup' | 'mfa_verify' | 'authenticated'>('login');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
        if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) setGlobalSearchTerm('');
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleLogin = async (email: string, pass: string) => {
      try {
          const user = await api.getCurrentUserByEmail(email);
          
          if (user) {
              setCurrentUser(user);
              // Role-based logic: Admins go to MFA setup, others go to verification for this demo
              setAuthState(user.role === 'Admin' ? 'mfa_setup' : 'mfa_verify');
              notify(`Welcome back, ${user.name.split(' ')[0]}!`, "success");
          } else {
              notify("No user found with this email.", "error");
          }
      } catch (err) {
          notify("Authentication failed. Check API configuration.", "error");
      }
  };

  const handleMfaVerify = () => setAuthState('authenticated');
  const handleLogout = () => {
      setAuthState('login');
      setCurrentUser(null);
      setIsProfileOpen(false);
  };
  
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const userSubsidiary = currentUser?.email.includes('tvarana') ? 'Tvarana' : (currentUser?.email.includes('79consulting') ? '79C' : 'Default');
  const isTvarana = userSubsidiary === 'Tvarana';
  const is79 = userSubsidiary === '79C';

  let appLogo = "https://cdn.prod.website-files.com/66d6b6395835bed75848a0c8/67179fa63247ccb8c4e04805_portalspro.png";
  if (isTvarana) appLogo = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEcF1k6s7r1ppBPbFUrRRle-RY1F-CDATueg&s";
  else if (is79) appLogo = "https://media.licdn.com/dms/image/v2/D4E22AQGDb302QrPB3A/feedshare-shrink_2048_1536/feedshare-shrink_2048_1536/0/1730735192751?e=2147483647&v=beta&t=Ex__PBAmGWEZqZcROCi8WwQ0_Jk1vwDCUmq8Iq7JlMI";

  const menuGroups = {
    core: [
      { id: 'dashboard', icon: FiHome, label: 'Dashboard', roles: ['all'] },
      { id: 'calendar', icon: FiCalendar, label: 'Calendar', roles: ['all'] },
      { id: 'directory', icon: FiUsers, label: 'Directory', roles: ['all'] },
    ],
    work: [
      { id: 'attendance', icon: RiCalendarScheduleLine, label: 'Attendance', roles: ['all'] },
      { id: 'leaves', icon: FiUmbrella, label: 'Leaves', roles: ['all'] }, 
      { id: 'approvals', icon: FiCheckCircle, label: 'Approvals', roles: ['Manager', 'Admin', 'HR', 'Lead'] },
      { id: 'performance', icon: FiTarget, label: 'Performance', roles: ['all'] },
      { id: 'referrals', icon: FiUserPlus, label: 'Referrals', roles: ['all'] },
    ],
    finance: [
      { id: 'payroll', icon: FiFileText, label: 'Payroll', roles: ['all'] },
      { id: 'documents', icon: FiFolder, label: 'Documents', roles: ['all'] },
      { id: 'helpdesk', icon: BiSupport, label: 'Helpdesk', roles: ['all'] },
      { id: 'reports', icon: TbReport, label: 'Reports', roles: ['Admin', 'Accounting', 'Manager', 'Lead'] },
    ],
    hr: [
      { id: 'onboarding', icon: FiFlag, label: 'Onboarding', roles: ['HR', 'Admin'] },
      { id: 'recruitment', icon: FiBriefcase, label: 'Recruitment', roles: ['HR', 'Admin'] },
    ],
    admin: [
        { id: 'admin_config', icon: FiSettings, label: 'Configuration', roles: ['Admin'] }
    ]
  };

  const allPages = Object.values(menuGroups).flat();

  useEffect(() => {
      if (globalSearchTerm && currentUser) {
          const lower = globalSearchTerm.toLowerCase();
          setSearchResult(allPages.filter(p => (p.roles.includes('all') || p.roles.includes(currentUser.role)) && p.label.toLowerCase().includes(lower)));
      } else setSearchResult([]);
  }, [globalSearchTerm, currentUser?.role]);

  const getFilteredItems = (items: any[]) => items.filter(item => item.roles.includes('all') || (currentUser && item.roles.includes(currentUser.role)));

  const renderContent = () => {
    if (!currentUser) return null;
    switch(currentView) {
      case 'dashboard': return <Dashboard user={currentUser} notify={notify} onNavigate={setCurrentView} />;
      case 'calendar': return <BigCalendar holidays={MOCK_HOLIDAYS} leaves={MOCK_LEAVES} canManage={['Admin', 'HR'].includes(currentUser.role)} notify={notify} />;
      case 'directory': return <Directory notify={notify} userRole={currentUser.role} />;
      case 'leaves': return <Leaves notify={notify} />;
      case 'approvals': return <Approvals notify={notify} currentUserId={currentUser.employee_id} userRole={currentUser.role} />;
      case 'payroll': return <Payroll notify={notify} />;
      case 'attendance': return <Attendance notify={notify} />;
      case 'helpdesk': return <Helpdesk notify={notify} />;
      case 'documents': return <Documents notify={notify} />;
      case 'performance': return <Performance />;
      case 'referrals': return <Referrals notify={notify} />;
      case 'onboarding': return <Onboarding role={currentUser.role} notify={notify} />;
      case 'recruitment': return <Recruitment role={currentUser.role} notify={notify} />;
      case 'admin_config': return <AdminConfig notify={notify} />;
      case 'profile': return <ProfileView user={currentUser} />;
      case 'reports': return <Reports userRole={currentUser.role} notify={notify} />;
      default: return <div className="p-10 text-center text-gray-500">Page under construction</div>;
    }
  };

  if (authState === 'login') return <LoginPage onLogin={handleLogin} />;
  if (authState === 'mfa_setup') return <MfaPage onVerify={handleMfaVerify} isSetup={true} />;
  if (authState === 'mfa_verify') return <MfaPage onVerify={handleMfaVerify} isSetup={false} />;

  if (!currentUser) return null;

  return (
    <div className="flex h-screen w-full bg-lightbg dark:bg-darkbg text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden font-sans">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <aside className="hidden md:flex flex-col items-center justify-between w-24 fixed left-4 top-4 bottom-4 z-50 pointer-events-none">
         <div className="flex-shrink-0 pointer-events-auto"><div className="w-20 h-20 flex items-center justify-center"><img src={appLogo} alt="Logo" className="w-16 h-16 object-contain drop-shadow-sm" /></div></div>
         <div className="flex-1 flex items-center justify-center w-full min-h-0 py-4 pointer-events-auto">
             <div className="w-full max-w-[4.5rem] h-fit max-h-full bg-white dark:bg-darkcard rounded-[3rem] shadow-xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-6 gap-2 overflow-y-auto no-scrollbar snap-y snap-mandatory scroll-py-6">
                {Object.values(menuGroups).map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                        {gIdx > 0 && getFilteredItems(group).length > 0 && <div className="w-6 h-[1px] bg-gray-100 dark:bg-white/5 flex-shrink-0 snap-start"></div>}
                        {getFilteredItems(group).map(item => (
                            <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative group flex-shrink-0 snap-start ${currentView === item.id ? 'bg-gray-100 dark:bg-white/10 text-brand' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}`} title={item.label}>
                                <item.icon size={20} />
                                <span className="absolute left-12 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">{item.label}</span>
                            </button>
                        ))}
                    </React.Fragment>
                ))}
             </div>
         </div>
      </aside>

      <div className="fixed top-0 left-0 md:left-32 right-0 h-20 z-40 px-6 md:px-10 flex items-center justify-between bg-lightbg/80 dark:bg-darkbg/80 backdrop-blur-md">
          <div className="md:hidden"><div className="w-10 h-10 rounded-xl bg-white dark:bg-darkcard flex items-center justify-center shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden"><img src={appLogo} alt="Logo" className="w-6 h-6 object-contain" /></div></div>
          <div className="hidden md:flex flex-1 max-w-xl mx-auto relative px-6" ref={searchRef}>
             <div className="w-full relative group">
                 <input type="text" placeholder="Search..." value={globalSearchTerm} onChange={(e) => setGlobalSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-full bg-white/50 dark:bg-darkcard/50 border border-gray-200 dark:border-white/10 hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none text-sm font-medium placeholder:text-gray-400" />
                 <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand" size={18} />
                 {globalSearchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-darkcard rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50">
                        {searchResult.length > 0 ? (
                            <div>{searchResult.map(page => (
                                <button key={page.id} onClick={() => { setCurrentView(page.id); setGlobalSearchTerm(''); }} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500"><page.icon size={16} /></div>
                                    <span className="font-medium">{page.label}</span>
                                </button>
                            ))}</div>
                        ) : <div className="p-6 text-center text-gray-400 text-sm">No pages found</div>}
                    </div>
                 )}
             </div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
             <div className="relative" ref={notifRef}>
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="w-10 h-10 rounded-xl bg-white dark:bg-darkcard border border-gray-200 dark:border-transparent flex items-center justify-center text-gray-500 hover:text-brand transition-colors shadow-sm relative">
                    <FiBell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-darkcard"></span>
                </button>
                {isNotifOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-darkcard rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 z-50 animate-fade-in origin-top-right overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Notifications</h3>
                            <button className="text-xs text-brand font-bold hover:underline">Mark all read</button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <div className="p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><FiFileText size={14} /></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Payslip Generated</p>
                                    <p className="text-xs text-gray-500">Your latest payslip is now available for review.</p>
                                    <p className="text-[10px] text-gray-400 mt-1">2 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
             </div>
             <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="w-10 h-10 rounded-xl bg-white dark:bg-darkcard flex items-center justify-center text-gray-500 hover:text-brand shadow-md transition-colors border border-gray-100 dark:border-white/5">{theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}</button>
             <div className="relative flex items-center" ref={profileRef}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center justify-center p-0.5 rounded-xl border-2 border-white dark:border-darkcard shadow-md hover:scale-105 transition-transform overflow-hidden"><img src={currentUser.avatar_url} className="w-11 h-11 object-cover bg-gray-800" alt="User" /></button>
                {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-darkcard rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-2 z-50 animate-fade-in origin-top-right">
                        <div className="p-3 border-b border-gray-100 dark:border-white/5 mb-2"><p className="font-bold text-sm truncate">{currentUser.name}</p><p className="text-xs text-gray-500 truncate">{currentUser.email}</p></div>
                        <button onClick={() => { setCurrentView('profile'); setIsProfileOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5"><FiUser /> Profile</button>
                        <button className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-red-500 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={handleLogout}><FiLogOut /> Logout</button>
                    </div>
                )}
            </div>
          </div>
      </div>
      <main className="flex-1 md:ml-32 h-full overflow-y-auto no-scrollbar pt-24 px-6 md:px-10 pb-10">{renderContent()}</main>
    </div>
  );
};

export default App;

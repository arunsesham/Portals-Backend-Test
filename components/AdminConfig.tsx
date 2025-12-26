import React, { useState } from 'react';
import { FiCheckCircle, FiDatabase, FiGlobe, FiKey, FiLock, FiRefreshCw, FiServer, FiXCircle, FiLayout, FiPlusCircle, FiSettings, FiImage, FiType } from 'react-icons/fi';
import { Card, Badge, Modal } from './Shared';

// --- Admin Configuration Page ---
// This is the control center for the System Admin.
// Here they can tell the app where to get its data from (like NetSuite or Salesforce).
// This connects the "front end" (what users see) to the "back end" (where data lives).

// Fix: Update notify prop type signature to make 'type' parameter optional to match App.tsx definition
export const AdminConfig = ({ notify }: { notify: (msg: string, type?: 'success' | 'error') => void }) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'integration'>('basic');
    
    // --- INTEGRATION STATE ---
    // State to track if the "Add Connection" popup is open
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Fake state to show which connections are active for the demo
    const [connections, setConnections] = useState([
        { id: 1, name: 'NetSuite ERP', type: 'ERP (Payroll)', status: 'Connected', lastSync: '10 mins ago', icon: 'N' },
        { id: 2, name: 'Salesforce CRM', type: 'CRM (Directory)', status: 'Disconnected', lastSync: 'Never', icon: 'S' }
    ]);

    // Form state for adding a new API connection
    const [newConnection, setNewConnection] = useState({
        name: '',
        endpoint: '',
        apiKey: '',
        targetModule: 'Employees' // Default module mapping
    });

    // --- BASIC CONFIG STATE ---
    const [basicConfig, setBasicConfig] = useState({
        companyName: 'Portals Pro',
        companyLogoUrl: 'https://cdn.prod.website-files.com/66d6b6395835bed75848a0c8/67179fa63247ccb8c4e04805_portalspro.png'
    });

    const handleConnect = () => {
        // In a real app, this would send the keys to the server to test the connection.
        // For now, we just pretend it worked and add it to the list.
        if (!newConnection.name) {
             notify("Connection name is required", "error");
             return;
        }
        
        setConnections([
            ...connections,
            { 
                id: Date.now(), 
                name: newConnection.name, 
                type: `REST API (${newConnection.targetModule})`, 
                status: 'Connected', 
                lastSync: 'Just now', 
                icon: 'A' 
            }
        ]);
        setIsModalOpen(false);
        setNewConnection({ name: '', endpoint: '', apiKey: '', targetModule: 'Employees' });
        notify("Data source connected successfully", "success");
    };

    const handleSaveBasic = () => {
        notify("Basic company settings updated successfully.", "success");
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Configuration</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage global settings and data integrations.</p>
                </div>
                {activeTab === 'integration' && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand text-brand-text px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-hover shadow-lg shadow-brand/20 transition-all"
                    >
                        <FiPlusCircle /> Connect Data Source
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-fit">
                <button 
                    onClick={() => setActiveTab('basic')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'basic' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <FiSettings /> Basic
                </button>
                <button 
                    onClick={() => setActiveTab('integration')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'integration' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <FiDatabase /> Integration
                </button>
            </div>

            {/* --- BASIC TAB CONTENT --- */}
            {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <Card>
                        <h3 className="font-bold text-lg mb-6">Company Identity</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                                <div className="relative">
                                    <FiType className="absolute left-3 top-3 text-gray-400" />
                                    <input 
                                        type="text" 
                                        value={basicConfig.companyName}
                                        onChange={(e) => setBasicConfig({...basicConfig, companyName: e.target.value})}
                                        className="w-full pl-10 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:border-brand"
                                        placeholder="Enter Company Name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo URL</label>
                                <div className="relative">
                                    <FiImage className="absolute left-3 top-3 text-gray-400" />
                                    <input 
                                        type="text" 
                                        value={basicConfig.companyLogoUrl}
                                        onChange={(e) => setBasicConfig({...basicConfig, companyLogoUrl: e.target.value})}
                                        className="w-full pl-10 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:border-brand"
                                        placeholder="https://example.com/logo.png"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Recommended size: 200x200px (PNG/SVG)</p>
                            </div>

                            <div className="pt-4">
                                <button onClick={handleSaveBasic} className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-white/5 border-dashed border-2 border-gray-200 dark:border-white/10">
                        <h4 className="text-gray-400 text-sm font-bold uppercase mb-4">Preview</h4>
                        <div className="p-6 bg-white dark:bg-darkcard rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                            <img src={basicConfig.companyLogoUrl} alt="Preview" className="w-20 h-20 object-contain" onError={(e) => e.currentTarget.src = 'https://placehold.co/200?text=Logo'} />
                        </div>
                        <p className="mt-4 font-bold text-xl text-gray-900 dark:text-white">{basicConfig.companyName}</p>
                    </Card>
                </div>
            )}

            {/* --- INTEGRATION TAB CONTENT --- */}
            {activeTab === 'integration' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {connections.map((conn) => (
                        <Card key={conn.id} className="relative overflow-hidden group">
                            {/* Status Indicator (Green/Red dot) */}
                            <div className="absolute top-4 right-4">
                                <Badge color={conn.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                    {conn.status === 'Connected' ? <span className="flex items-center gap-1"><FiCheckCircle /> Live</span> : <span className="flex items-center gap-1"><FiXCircle /> Offline</span>}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                {/* Icon Placeholder */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${conn.name.includes('NetSuite') ? 'bg-blue-900 text-white' : conn.name.includes('Salesforce') ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {conn.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{conn.name}</h3>
                                    <p className="text-xs text-gray-500">{conn.type}</p>
                                </div>
                            </div>

                            {/* Sync Info */}
                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Last Sync</span>
                                    <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{conn.lastSync}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Data Points</span>
                                    <span className="font-mono font-medium text-gray-700 dark:text-gray-300">1,240 records</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                                    <FiRefreshCw /> Sync Now
                                </button>
                                <button className="px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                                    <FiSettings />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal for adding new connection */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Connect New Data Source">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Enter the API credentials for the external system you want to pull data from.
                    </p>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source Name</label>
                        <div className="relative">
                            <FiDatabase className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text" 
                                className="w-full pl-10 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:border-brand" 
                                placeholder="e.g. Legacy HR System"
                                value={newConnection.name}
                                onChange={(e) => setNewConnection({...newConnection, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Module</label>
                        <div className="relative">
                            <FiLayout className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                            <select 
                                className="w-full pl-10 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:border-brand appearance-none"
                                value={newConnection.targetModule}
                                onChange={(e) => setNewConnection({...newConnection, targetModule: e.target.value})}
                            >
                                <option value="Employees">Employees (Directory)</option>
                                <option value="Payroll">Payroll</option>
                                <option value="Leaves">Leaves</option>
                                <option value="Attendance">Attendance</option>
                                <option value="Helpdesk">Helpdesk Tickets</option>
                                <option value="Documents">Documents</option>
                                <option value="Recruitment">Recruitment (Jobs)</option>
                                <option value="Performance">Performance (Goals)</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Which section of the app will this API feed data into?</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Endpoint URL</label>
                        <div className="relative">
                            <FiGlobe className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text" 
                                className="w-full pl-10 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:border-brand" 
                                placeholder="https://api.example.com/v1/employees"
                                value={newConnection.endpoint}
                                onChange={(e) => setNewConnection({...newConnection, endpoint: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authentication Key / Token</label>
                        <div className="relative">
                            <FiKey className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="password" 
                                className="w-full pl-10 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:border-brand" 
                                placeholder="sk_live_..."
                                value={newConnection.apiKey}
                                onChange={(e) => setNewConnection({...newConnection, apiKey: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            onClick={handleConnect} 
                            className="w-full py-3 bg-brand text-brand-text font-bold rounded-xl hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
                        >
                            <FiLock size={16} /> Secure Connect
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
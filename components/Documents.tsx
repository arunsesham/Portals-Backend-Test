
import React, { useState, useEffect } from 'react';
import { FiPlus, FiFileText, FiMoreVertical, FiDownload, FiFolder, FiChevronRight, FiUpload, FiArrowLeft } from 'react-icons/fi';
import { Card, Badge, Modal, CustomDropdown } from './Shared';
import { api } from '../services/api';
import { Document } from '../types';

export const Documents = ({ notify }: { notify: (msg: string, type: 'success' | 'error') => void }) => {
    const [activeTab, setActiveTab] = useState<'Shared' | 'Personal'>('Shared');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [destinationFolder, setDestinationFolder] = useState('Company');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const companyFolders = [
        { name: 'Policies', count: documents.filter(d => d.category === 'Policy').length, color: 'text-blue-500' },
        { name: 'Training', count: documents.filter(d => d.category === 'Form').length, color: 'text-purple-500' },
        { name: 'Project Assets', count: 0, color: 'text-orange-500' },
        { name: 'Forms', count: 0, color: 'text-green-500' },
    ];

    const folderOptions = ['My Documents', ...companyFolders.map(f => `${f.name} (Shared)`)];

    const loadDocs = async () => {
        setIsLoading(true);
        try {
            const data = await api.getDocuments(activeTab === 'Shared' ? 'Company' : 'Personal');
            setDocuments(data);
        } catch (err: any) {
            notify(err.message || "Failed to load documents", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDocs();
    }, [activeTab]);

    const getFolderTag = (fName: string) => {
        if (fName === 'Policies') return 'Policy';
        if (fName === 'Training') return 'Form'; 
        return 'Policy';
    };

    const filteredDocs = currentFolder ? documents.filter(d => d.category === getFolderTag(currentFolder)) : documents;

    const handleStartUpload = async () => {
        notify(`File uploading to ${destinationFolder}...`, "success");
        try {
            await api.uploadDocument({
                name: "New_Document.pdf", // Static for demo, in real it would come from file input
                category: "Policy",
                size: "1.2 MB",
                folder: destinationFolder.includes('Shared') ? 'Company' : 'Personal',
                employee_id: 400
            });
            setIsUploadOpen(false);
            notify("File uploaded successfully to S3!", "success");
            loadDocs();
        } catch (err: any) {
            notify(err.message || "Upload failed", "error");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Document Management</h2>
                    <p className="text-sm text-gray-500">Secure storage for your work and company files.</p>
                </div>
                <button onClick={() => setIsUploadOpen(true)} className="px-4 py-2.5 bg-brand text-brand-text rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand/20">
                    <FiPlus strokeWidth={3} /> Upload File
                </button>
            </div>

            <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-fit border border-gray-200 dark:border-white/5">
                <button onClick={() => { setActiveTab('Shared'); setCurrentFolder(null); }} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'Shared' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Company Shared Files</button>
                <button onClick={() => { setActiveTab('Personal'); setCurrentFolder(null); }} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'Personal' ? 'bg-white dark:bg-darkcard shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>My Documents</button>
            </div>

            {currentFolder ? (
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentFolder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl text-gray-400 hover:text-brand transition-colors">
                        <FiArrowLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{activeTab === 'Shared' ? 'Shared Files' : 'Personal'} / {currentFolder}</span>
                </div>
            ) : activeTab === 'Shared' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {companyFolders.map(folder => (
                        <Card key={folder.name} className="flex items-center gap-4 cursor-pointer hover:border-brand transition-all group" noPadding={true}>
                            <div className="p-5 flex items-center gap-4 w-full" onClick={() => setCurrentFolder(folder.name)}>
                                <div className={`p-3 rounded-xl bg-gray-50 dark:bg-white/5 ${folder.color}`}>
                                    <FiFolder size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{folder.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium">{folder.count} Files</p>
                                </div>
                                <FiChevronRight className="text-gray-300 group-hover:text-brand transition-colors" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map(doc => (
                    <Card key={doc.id} className="flex flex-col group hover:border-brand transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${doc.category === 'Policy' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'} dark:bg-white/5`}>
                                <FiFileText size={24} />
                            </div>
                            <button className="text-gray-400 hover:text-brand transition-colors"><FiMoreVertical /></button>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{doc.name}</h3>
                        <p className="text-xs text-gray-500 mb-1">{doc.category} • {doc.size}</p>
                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Modified {new Date(doc.date).toLocaleDateString()}</span>
                            <button 
                                onClick={() => window.open((doc as any).s3_url, '_blank')}
                                className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500 hover:text-brand transition-colors"
                            >
                                <FiDownload size={18} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Document">
                <div className="space-y-5 overflow-visible">
                    <div className="relative z-30">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Select Destination Folder</label>
                        <CustomDropdown 
                            options={folderOptions}
                            value={destinationFolder}
                            onChange={setDestinationFolder}
                            fullWidth={true}
                            icon={FiFolder}
                        />
                    </div>
                    <div className="w-full p-10 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-brand hover:bg-brand/5 transition-all cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center shadow-inner"><FiUpload size={32} /></div>
                        <p className="text-sm text-gray-500 font-black">Browse local files or drag and drop</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Max File size: 100MB • PDF, JPG, PNG, XLSX</p>
                    </div>
                    <button 
                        onClick={handleStartUpload} 
                        className="w-full py-4 bg-brand text-brand-text font-black rounded-2xl shadow-xl mt-2 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all"
                    >
                        <FiUpload size={20} /> Start Secure Upload
                    </button>
                </div>
            </Modal>
        </div>
    );
};

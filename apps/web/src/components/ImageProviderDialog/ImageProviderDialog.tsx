import React, { useState } from 'react';
import { UploadTab } from './UploadTab';
import { SearchTab } from './SearchTab';
import { GenerateTab } from './GenerateTab';
import { Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ImageProviderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImageSelect: (ref: string) => void;
}

type Tab = 'upload' | 'search' | 'generate';

export const ImageProviderDialog: React.FC<ImageProviderDialogProps> = ({
    isOpen,
    onClose,
    onImageSelect
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('upload');
    const { user } = useAuth();
    const isPremium = user?.plan === 'premium';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-[#1e2025] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-[#25282e]">
                    <h2 className="text-xl font-bold text-white">Add Image</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex px-6 pt-4 space-x-2 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-t border-l border-r ${activeTab === 'upload'
                            ? 'bg-[#1e2025] text-white border-gray-700 border-b-[#1e2025] -mb-px'
                            : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                            }`}
                    >
                        Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 border-t border-l border-r ${activeTab === 'search'
                            ? 'bg-[#1e2025] text-blue-400 border-gray-700 border-b-[#1e2025] -mb-px'
                            : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                    </button>
                    <button
                        onClick={() => setActiveTab('generate')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 border-t border-l border-r ${activeTab === 'generate'
                            ? 'bg-[#1e2025] text-pink-400 border-gray-700 border-b-[#1e2025] -mb-px'
                            : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
                            }`}
                    >
                        {isPremium ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        ) : (
                            <Lock className="w-3 h-3" />
                        )}
                        Generate
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 flex-1 min-h-[400px]">
                    {activeTab === 'upload' && <UploadTab onImageSelect={onImageSelect} />}
                    {activeTab === 'search' && <SearchTab onImageSelect={onImageSelect} />}
                    {activeTab === 'generate' && <GenerateTab onImageSelect={onImageSelect} />}
                </div>
            </div>
        </div>
    );
};

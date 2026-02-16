import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, LayoutGrid, Upload, Search, Wand2, Image as ImageIcon } from 'lucide-react';
import type { Asset, AssetCategory } from '../../types/asset';
import { AssetLibrary } from './AssetLibrary';
import { AssetUpload } from './AssetUpload';
import { AssetSearch } from './AssetSearch';
import { AssetGenerate } from './AssetGenerate';

interface AssetManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onAssetSelect?: (asset: Asset) => void;
    initialCategory?: AssetCategory;
    cardElements?: import('../../types/element').CardElement[];
    selectedElementId?: string | null;
    cardWidth?: number;
    cardHeight?: number;
    onShowToast?: (message: string, type?: 'success' | 'error' | 'info' | 'loading') => void;
}

type Tab = 'library' | 'upload' | 'search' | 'generate';

const CATEGORIES: { value: AssetCategory, label: string }[] = [
    { value: 'main-illustration', label: 'Main Illustration' },
    { value: 'front-background', label: 'Front Background' },
    { value: 'back-background', label: 'Back Background' },
    { value: 'icon', label: 'Icon' },
    { value: 'other', label: 'Other' },
];

export const AssetManager: React.FC<AssetManagerProps> = ({
    isOpen,
    onClose,
    onAssetSelect,
    initialCategory = 'main-illustration',
    cardElements = [],
    selectedElementId = null,
    cardWidth = 375, // Default logical width
    cardHeight = 525, // Default logical height
    onShowToast
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('library');
    const [category, setCategory] = useState<AssetCategory>(initialCategory);

    // Reset category when opened with new initialCategory
    // We use a ref or effect to track open state changes
    useEffect(() => {
        if (isOpen) {
            setCategory(initialCategory);
        }
    }, [isOpen, initialCategory]);

    if (!isOpen) return null;

    const handleAssetSelect = (asset: Asset) => {
        if (onAssetSelect) {
            onAssetSelect(asset);
        }
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-6xl bg-[#1e2025] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-[#25282e]">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg shadow-lg shadow-pink-500/20">
                                <ImageIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Asset Manager</h2>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Manage & Create Assets</p>
                            </div>
                        </div>

                        {/* Global Category Selector */}
                        <div className="h-10 w-px bg-gray-700 mx-2" />

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-400">Category:</label>
                            <div className="relative">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as AssetCategory)}
                                    className="appearance-none bg-[#1a1d23] border border-gray-600 hover:border-gray-500 text-white rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-pink-500 transition-colors text-sm min-w-[160px]"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Navigation (Desktop) */}
                    <div className="w-64 bg-[#1a1d23] border-r border-gray-700 hidden md:flex flex-col p-4 space-y-2">
                        <NavButton
                            active={activeTab === 'library'}
                            onClick={() => setActiveTab('library')}
                            icon={<LayoutGrid className="w-5 h-5" />}
                            label="Asset Library"
                            description="Browse your collection"
                        />
                        <div className="h-px bg-gray-800 my-2" />
                        <NavButton
                            active={activeTab === 'upload'}
                            onClick={() => setActiveTab('upload')}
                            icon={<Upload className="w-5 h-5" />}
                            label="Upload Files"
                            description="Drag & drop images"
                        />
                        <NavButton
                            active={activeTab === 'search'}
                            onClick={() => setActiveTab('search')}
                            icon={<Search className="w-5 h-5" />}
                            label="Web Search"
                            description="Find images online"
                        />
                        <NavButton
                            active={activeTab === 'generate'}
                            onClick={() => setActiveTab('generate')}
                            icon={<Wand2 className="w-5 h-5" />}
                            label="AI Generator"
                            description="Create with AI"
                            badge="PRO"
                        />
                    </div>

                    {/* Mobile Tabs */}
                    <div className="md:hidden flex overflow-x-auto bg-[#1a1d23] border-b border-gray-700 absolute top-0 left-0 right-0 z-10">
                        {/* Not implemented fully for brevity, defaulting to desktop sidebar logic for now */}
                    </div>

                    {/* Active Tab Content */}
                    <div className="flex-1 bg-[#1a1d23] relative flex flex-col min-w-0">
                        {activeTab === 'library' && (
                            <AssetLibrary
                                onAssetSelect={handleAssetSelect}
                                category={category}
                                onShowToast={onShowToast}
                            />
                        )}
                        {activeTab === 'upload' && (
                            <div className="h-full p-6">
                                <h3 className="text-2xl font-bold text-white mb-6">Upload Assets</h3>
                                <AssetUpload
                                    onUploadSuccess={() => {
                                        // Switch to library to show the new asset
                                        setActiveTab('library');
                                    }}
                                    category={category}
                                />
                            </div>
                        )}
                        {activeTab === 'search' && (
                            <div className="h-full flex flex-col">
                                <AssetSearch
                                    onAssetImported={(asset) => {
                                        // Optional: Select the imported asset immediately
                                        if (onAssetSelect) {
                                            onAssetSelect(asset);
                                        }
                                        setActiveTab('library');
                                    }}
                                    category={category}
                                />
                            </div>
                        )}
                        {activeTab === 'generate' && (
                            <div className="h-full flex flex-col">
                                <AssetGenerate
                                    onAssetGenerated={() => {
                                        setActiveTab('library');
                                    }}
                                    category={category}
                                    cardElements={cardElements}
                                    selectedElementId={selectedElementId}
                                    cardWidth={cardWidth}
                                    cardHeight={cardHeight}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    description?: string;
    badge?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, description, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-3 rounded-xl transition-all group text-left ${active
            ? 'bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/50'
            : 'hover:bg-[#25282e] border border-transparent'
            }`}
    >
        <div className={`p-2 rounded-lg mr-3 transition-colors ${active ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25' : 'bg-[#25282e] text-gray-400 group-hover:text-white group-hover:bg-[#32363e]'
            }`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <span className={`font-semibold text-sm ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                    {label}
                </span>
                {badge && (
                    <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 shadow-sm">
                        {badge}
                    </span>
                )}
            </div>
            {description && (
                <p className="text-xs text-gray-500 truncate mt-0.5 group-hover:text-gray-400">{description}</p>
            )}
        </div>
    </button>
);

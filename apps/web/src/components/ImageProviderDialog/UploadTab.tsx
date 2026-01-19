import React, { useRef, useState } from 'react';
import { imageService } from '../../services/imageService';

interface UploadTabProps {
    onImageSelect: (ref: string) => void;
}

export const UploadTab: React.FC<UploadTabProps> = ({ onImageSelect }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataURL = e.target?.result as string;
                const ref = await imageService.processImage(dataURL);
                if (ref) {
                    onImageSelect(ref);
                }
                setLoading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Error processing image:', err);
            setLoading(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div
                className={`w-full max-w-md h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragOver
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/30'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={onFileChange}
                />

                {loading ? (
                    <div className="flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="text-gray-400">Processing...</div>
                    </div>
                ) : (
                    <>
                        <div className="w-12 h-12 mb-3 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-200">Click or Drag Image Here</p>
                        <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, WEBP, GIF</p>
                    </>
                )}
            </div>
        </div>
    );
};

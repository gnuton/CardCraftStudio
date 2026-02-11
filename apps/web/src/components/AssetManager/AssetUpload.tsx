import React, { useRef, useState } from 'react';
import { assetService } from '../../services/assetService';
import type { Asset, AssetCategory } from '../../types/asset';
import { Upload, Loader2 } from 'lucide-react';

interface AssetUploadProps {
    onUploadSuccess: (asset: Asset) => void;
    category: AssetCategory;
}

export const AssetUpload: React.FC<AssetUploadProps> = ({ onUploadSuccess, category }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataURL = e.target?.result as string;

                try {
                    const asset = await assetService.createAsset({
                        imageData: dataURL,
                        fileName: file.name,
                        source: 'uploaded',
                        category,
                        tags: ['uploaded'],
                        mimeType: file.type
                    });

                    onUploadSuccess(asset);
                } catch (err) {
                    console.error('Error creating asset:', err);
                    alert('Failed to upload asset');
                } finally {
                    setLoading(false);
                }
            };
            reader.onerror = () => {
                console.error('Error reading file');
                setLoading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Error uploading asset:', err);
            setLoading(false);
            alert('Failed to upload asset');
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
        <div className="h-full flex flex-col items-center justify-center p-6 bg-[#1a1d23]">
            {/* Category is now selected globally in AssetManager */}
            <div className="w-full max-w-xl text-center mb-6">
                <p className="text-gray-400 text-sm">Uploading to: <span className="text-white font-medium capitalize">{category.replace('-', ' ')}</span></p>
            </div>

            <div
                className={`w-full max-w-xl h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${isDragOver
                    ? 'border-pink-500 bg-pink-500/10'
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
                    accept="image/*,.svg"
                    onChange={onFileChange}
                />

                {loading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin h-10 w-10 text-pink-500 mb-4" />
                        <div className="text-gray-300 font-medium">Uploading Asset...</div>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 mb-4 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-xl font-medium text-white mb-2">Click or Drag Image Here</p>
                        <p className="text-sm text-gray-400">Supports JPG, PNG, WEBP, GIF, SVG</p>
                    </>
                )}
            </div>
        </div>
    );
};

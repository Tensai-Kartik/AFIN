'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { uploadMultipleImages } from '@/lib/storage';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

interface ImageUploadProps {
  maxImages?: number;
  folderName: 'lost_found' | 'accommodation';
  onUploadComplete: (urls: string[]) => void;
}

export function ImageUpload({ maxImages = 5, folderName, onUploadComplete }: ImageUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user) {
      toast.error('You must be logged in to upload images.');
      return;
    }

    const currentCount = uploadedUrls.length;
    if (currentCount >= maxImages) {
      toast.error(`Maximum of ${maxImages} images allowed.`);
      return;
    }

    const newFiles = Array.from(files).slice(0, maxImages - currentCount);
    const validFiles: File[] = [];

    // Validation
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create immediate local previews
    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    setIsUploading(true);

    try {
      // Upload to Supabase
      const newUrls = await uploadMultipleImages(validFiles, folderName, user.id);
      
      const allUrls = [...uploadedUrls, ...newUrls];
      setUploadedUrls(allUrls);
      onUploadComplete(allUrls);
      
      toast.success(`${validFiles.length} image(s) uploaded successfully!`);
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload images.');
      // Cleanup broken previews
      setPreviewUrls(prev => prev.slice(0, prev.length - validFiles.length));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isUploading) return;
    handleFiles(e.dataTransfer.files);
  }, [isUploading, uploadedUrls.length]);

  const handleRemove = (index: number) => {
    if (isUploading) return;
    
    // Cleanup object URL
    URL.revokeObjectURL(previewUrls[index]);
    
    const newPreviews = [...previewUrls];
    newPreviews.splice(index, 1);
    setPreviewUrls(newPreviews);

    const newUploaded = [...uploadedUrls];
    newUploaded.splice(index, 1);
    setUploadedUrls(newUploaded);
    
    onUploadComplete(newUploaded);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-700">Upload Images (optional)</label>
        <span className="text-xs text-slate-500">
          {uploadedUrls.length} / {maxImages} uploaded
        </span>
      </div>

      {/* Upload Area */}
      {uploadedUrls.length < maxImages && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
            ${isUploading ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-blue-50 hover:border-blue-300 border-slate-200'}
          `}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            disabled={isUploading}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            </div>
            <div className="text-sm">
              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
            </div>
            <div className="text-xs text-slate-500">
              JPG, PNG, WEBP (max 5MB each)
            </div>
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-4">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                width={200}
                height={200}
                unoptimized
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  disabled={isUploading}
                  className="p-1.5 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {/* Uploading placeholders if needed could go here */}
        </div>
      )}
    </div>
  );
}

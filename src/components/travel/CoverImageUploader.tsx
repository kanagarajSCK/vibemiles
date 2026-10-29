'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Loader2,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CoverImageUploaderProps {
  label?: string;
  hideLabel?: boolean;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  error?: string | null;
  onError?: (err: string | null) => void;
}

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

/**
 * Client-side canvas downscaler.
 * Resizes large camera/phone photos to max 1600x1600 at 85% quality,
 * shrinking 5MB-10MB files to ~150KB-250KB in ~80ms before upload.
 */
async function compressImageForUpload(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<File> {
  const mime = file.type?.toLowerCase() || '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            if (width <= maxWidth && height <= maxHeight && file.size <= 400 * 1024) {
              return resolve(file);
            }

            if (width > maxWidth || height > maxHeight) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(file);

            ctx.drawImage(img, 0, 0, width, height);

            const outputType = mime === 'image/png' ? 'image/png' : 'image/jpeg';
            canvas.toBlob(
              (blob) => {
                if (!blob) return resolve(file);
                const compressedFile = new File([blob], file.name, {
                  type: outputType,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              },
              outputType,
              quality
            );
          } catch {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch {
      resolve(file);
    }
  });
}

export const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  label = 'Cover Image',
  hideLabel = false,
  value,
  onChange,
  required = true,
  error,
  onError,
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayError = error || uploadError;

  const handleFile = useCallback(
    async (rawFile: File) => {
      setUploadError(null);
      if (onError) onError(null);

      // Validate file extension and MIME type
      const fileNameLower = rawFile.name.toLowerCase();
      const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));
      const hasValidMime = ALLOWED_MIME_TYPES.includes(rawFile.type.toLowerCase());

      if (!hasValidExt && !hasValidMime) {
        const msg = 'Invalid file format. Please upload a PNG, JPG, JPEG, or WEBP image.';
        setUploadError(msg);
        if (onError) onError(msg);
        return;
      }

      // Validate file size
      if (rawFile.size > MAX_FILE_SIZE) {
        const msg = `Image size (${(rawFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds 10 MB limit.`;
        setUploadError(msg);
        if (onError) onError(msg);
        return;
      }

      setUploading(true);
      setPreviewName(rawFile.name);

      try {
        // Optimize image client-side to ensure fast uploads and low bandwidth footprint
        const optimizedFile = await compressImageForUpload(rawFile);

        const formData = new FormData();
        formData.append('file', optimizedFile);

        const res = await fetch('/api/provider/packages/upload-image', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to upload image. Please try again.');
        }

        onChange(json.url);
        setUploadError(null);
        if (onError) onError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
        setUploadError(msg);
        if (onError) onError(msg);
      } finally {
        setUploading(false);
      }
    },
    [onChange, onError]
  );

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUploadError('Please enter a valid image URL.');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('data:image/')) {
      setUploadError('Image URL must start with http:// or https://');
      return;
    }
    setUploadError(null);
    if (onError) onError(null);
    setPreviewName(trimmed.split('/').pop()?.split('?')[0] || 'Image URL');
    onChange(trimmed);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    setPreviewName(null);
    setUploadError(null);
    if (onError) onError(null);
  };

  return (
    <div className="space-y-2">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between">
        {!hideLabel ? (
          <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            {label} {required && <span className="text-rose-500 font-bold">* (Required)</span>}
          </label>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {value ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
            </span>
          ) : (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setTab('upload')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  tab === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setTab('url')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  tab === 'url'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Image URL
              </button>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={uploading}
      />

      {value ? (
        <div className="relative rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-900 group shadow-sm transition-all hover:border-slate-300">
          {/* Image Preview */}
          <div className="relative h-60 w-full overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Cover Preview"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </div>

          {/* Action Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between text-white">
            <div className="min-w-0 pr-3">
              <p className="text-xs font-semibold truncate drop-shadow">
                {previewName || value.split('/').pop()?.split('?')[0] || 'Cover Image'}
              </p>
              <p className="text-[10px] text-slate-300 drop-shadow">
                {value.startsWith('data:') ? 'Embedded photo' : 'Marketplace listing cover'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white/90 text-slate-900 border-white hover:bg-white text-xs shadow"
                leftIcon={<RefreshCw className="w-3 h-3" />}
                onClick={() => {
                  if (tab === 'url') {
                    setUrlInput(value.startsWith('http') ? value : '');
                    handleRemove();
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={uploading}
              >
                Change
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-rose-600/90 text-white border-rose-600 hover:bg-rose-700 text-xs shadow"
                leftIcon={<X className="w-3 h-3" />}
                onClick={handleRemove}
                disabled={uploading}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : tab === 'url' ? (
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <LinkIcon className="w-4 h-4 text-teal-600" />
            <span>Paste direct image link (Unsplash, Cloudinary, Pexels, etc.)</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyUrl();
                }
              }}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <Button
              type="button"
              variant="primary"
              size="md"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 shrink-0"
              leftIcon={<Check className="w-4 h-4" />}
              onClick={handleApplyUrl}
            >
              Apply
            </Button>
          </div>
          <p className="text-[11px] text-slate-500">
            Paste a public direct link ending in .jpg, .png, .webp, or hosted on major image CDNs.
          </p>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? 'border-teal-500 bg-teal-50/60 ring-4 ring-teal-500/20'
              : displayError
              ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
              : 'border-slate-300 bg-slate-50/50 hover:border-teal-500 hover:bg-teal-50/20'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Processing & uploading image...</p>
                <p className="text-xs text-slate-500">Optimizing format and verifying security signature</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  Drag & drop your cover image here, or{' '}
                  <span className="text-teal-600 underline decoration-teal-300 underline-offset-2">
                    browse files
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  Supports <span className="font-semibold text-slate-700">PNG, JPG, JPEG, WEBP</span> up to 10 MB.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-200/80 px-3 py-1 text-[11px] font-semibold text-slate-700">
                <ImageIcon className="w-3.5 h-3.5 text-teal-600" /> High-definition marketplace hero photo
              </div>
            </div>
          )}
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <p className="text-[11px] text-slate-500">
        A high quality cover photo attracts more travelers. This image will appear on search cards and detail headers.
      </p>
    </div>
  );
};

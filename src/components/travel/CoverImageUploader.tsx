'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle, X, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CoverImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  error?: string | null;
  onError?: (err: string | null) => void;
}

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  value,
  onChange,
  required = true,
  error,
  onError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayError = error || uploadError;

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      if (onError) onError(null);

      // Validate file extension
      const fileNameLower = file.name.toLowerCase();
      const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));
      const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());

      if (!hasValidExt && !hasValidMime) {
        const msg = 'Invalid file format. Please upload a PNG, JPG, JPEG, or WEBP image.';
        setUploadError(msg);
        if (onError) onError(msg);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const msg = `Image size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 10 MB limit.`;
        setUploadError(msg);
        if (onError) onError(msg);
        return;
      }

      setUploading(true);
      setPreviewName(file.name);

      try {
        const formData = new FormData();
        formData.append('file', file);

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
      // Reset input so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    setPreviewName(null);
    setUploadError(null);
    if (onError) onError(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          Cover Image {required && <span className="text-rose-500 font-bold">* (Required)</span>}
        </label>
        {value && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
          </span>
        )}
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
                {previewName || value.split('/').pop() || 'Cover Image'}
              </p>
              <p className="text-[10px] text-slate-300 drop-shadow">Uploaded listing cover</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white/90 text-slate-900 border-white hover:bg-white text-xs shadow"
                leftIcon={<RefreshCw className="w-3 h-3" />}
                onClick={() => fileInputRef.current?.click()}
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
                <p className="text-sm font-bold text-slate-800">Uploading cover image...</p>
                <p className="text-xs text-slate-500">Validating image format and security signature</p>
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
                  <span className="text-teal-600 underline decoration-teal-300 underline-offset-2">browse files</span>
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

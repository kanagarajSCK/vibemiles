'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
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
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  PACKAGE_CATEGORIES,
  getCategoryDefaultCoverImage,
  normalizeCategorySlug,
  CATEGORY_COVER_IMAGES,
} from '@/constants';

export interface CoverImageUploaderProps {
  label?: string;
  hideLabel?: boolean;
  category?: string;
  value?: string;
  images?: string[];
  onChange: (urlOrImages: any, allImages?: string[]) => void;
  maxImages?: number;
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
  label = 'Cover & Property Images',
  hideLabel = false,
  category,
  value,
  images: controlledImages,
  onChange,
  maxImages = 10,
  required = true,
  error,
  onError,
}) => {
  // Normalize images list from props
  const imageList: string[] = useMemo(() => {
    if (Array.isArray(controlledImages) && controlledImages.length > 0) {
      return controlledImages.filter((u) => typeof u === 'string' && u.trim().length > 0);
    }
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return [value.trim()];
    }
    return [];
  }, [controlledImages, value]);

  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayError = error || uploadError;

  // Resolve category details for suggestion
  const categoryMeta = useMemo(() => {
    if (!category) return null;
    const normalized = normalizeCategorySlug(category);
    const cat = PACKAGE_CATEGORIES.find((c) => c.value === normalized);
    const defaultCover = getCategoryDefaultCoverImage(normalized);
    return {
      label: cat?.label || category,
      icon: cat?.icon || '📸',
      defaultCover,
    };
  }, [category]);

  const emitChange = useCallback(
    (newList: string[]) => {
      // If parent used images array prop
      if (Array.isArray(controlledImages)) {
        onChange(newList, newList);
      } else {
        // Parent used value string prop
        onChange(newList[0] || '', newList);
      }
    },
    [controlledImages, onChange]
  );

  const handleFiles = useCallback(
    async (rawFiles: FileList | File[]) => {
      const filesArray = Array.from(rawFiles);
      if (filesArray.length === 0) return;

      const remainingSlots = maxImages - imageList.length;
      if (remainingSlots <= 0) {
        const msg = `Maximum limit of ${maxImages} images reached. Remove an image to add more.`;
        setUploadError(msg);
        if (onError) onError(msg);
        return;
      }

      const filesToUpload = filesArray.slice(0, remainingSlots);

      setUploadError(null);
      if (onError) onError(null);
      setUploading(true);

      const newlyUploaded: string[] = [];

      try {
        for (const rawFile of filesToUpload) {
          // Validate extension
          const fileNameLower = rawFile.name.toLowerCase();
          const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));
          const hasValidMime = ALLOWED_MIME_TYPES.includes(rawFile.type.toLowerCase());

          if (!hasValidExt && !hasValidMime) {
            throw new Error(`"${rawFile.name}" is not a supported format. Please upload PNG, JPG, or WEBP.`);
          }

          if (rawFile.size > MAX_FILE_SIZE) {
            throw new Error(`"${rawFile.name}" exceeds the 10 MB limit.`);
          }

          // Optimize client-side
          const optimizedFile = await compressImageForUpload(rawFile);
          const formData = new FormData();
          formData.append('file', optimizedFile);

          const res = await fetch('/api/provider/packages/upload-image', {
            method: 'POST',
            body: formData,
          });

          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json.success || !json.url) {
            throw new Error(json.error || `Failed to upload "${rawFile.name}".`);
          }

          newlyUploaded.push(json.url);
        }

        if (newlyUploaded.length > 0) {
          const updated = [...imageList, ...newlyUploaded];
          emitChange(updated);
          setUploadError(null);
          if (onError) onError(null);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
        setUploadError(msg);
        if (onError) onError(msg);
      } finally {
        setUploading(false);
      }
    },
    [imageList, maxImages, onError, emitChange]
  );

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUploadError('Please enter a valid image URL.');
      return;
    }

    if (imageList.length >= maxImages) {
      setUploadError(`Maximum limit of ${maxImages} images reached.`);
      return;
    }

    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('data:image/')) {
      setUploadError('Image URL must start with http:// or https://');
      return;
    }

    const updated = [...imageList, trimmed];
    emitChange(updated);
    setUrlInput('');
    setUploadError(null);
    if (onError) onError(null);
  };

  const handleSetCover = (index: number) => {
    if (index === 0 || index >= imageList.length) return;
    const target = imageList[index];
    const filtered = imageList.filter((_, idx) => idx !== index);
    const updated = [target, ...filtered];
    emitChange(updated);
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= imageList.length) return;

    const updated = [...imageList];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    emitChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = imageList.filter((_, idx) => idx !== index);
    emitChange(updated);
    if (updated.length === 0 && required) {
      if (onError) onError('At least one cover image is required.');
    } else {
      setUploadError(null);
      if (onError) onError(null);
    }
  };

  const handleUseCuratedCover = () => {
    if (!categoryMeta?.defaultCover) return;
    // Prepend as cover if not already present
    const withoutExisting = imageList.filter((u) => u !== categoryMeta.defaultCover);
    const updated = [categoryMeta.defaultCover, ...withoutExisting].slice(0, maxImages);
    emitChange(updated);
    setUploadError(null);
    if (onError) onError(null);
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
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const coverImage = imageList[0] || null;
  const secondaryImages = imageList.slice(1);

  return (
    <div className="space-y-4">
      {/* ─── Header & Mode Controls ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          {!hideLabel ? (
            <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-slate-700">
              {label} {required && <span className="text-rose-500 font-bold">*</span>}
            </label>
          ) : (
            <div />
          )}
          <p className="text-[11px] text-slate-500">
            First photo is your <span className="font-semibold text-emerald-700">Cover Photo</span>. You can upload multiple images and choose which photo to set as cover.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {imageList.length} / {maxImages} Photos
          </span>

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
              Upload
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
              Add Link
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Multi-Select */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={uploading}
      />

      {/* ─── Category-Specific Curated Recommendation Banner ─────────── */}
      {categoryMeta && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-200/80 bg-linear-to-r from-teal-50/90 via-emerald-50/60 to-cyan-50/70 p-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base select-none">{categoryMeta.icon}</span>
            <div className="min-w-0">
              <span className="font-bold text-teal-900">
                {categoryMeta.label} Category Recommendation:
              </span>{' '}
              <span className="text-teal-700 hidden sm:inline">
                Upload authentic, high-definition photos of your {categoryMeta.label.toLowerCase()}.
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 bg-white hover:bg-teal-50 border-teal-300 text-teal-800 text-[11px] font-bold shadow-xs py-1 h-auto"
            leftIcon={<Sparkles className="w-3 h-3 text-amber-500" />}
            onClick={handleUseCuratedCover}
          >
            Use Curated {categoryMeta.label} Cover
          </Button>
        </div>
      )}

      {/* ─── Hero Cover Photo Display (When At Least 1 Image Exists) ─── */}
      {coverImage && (
        <div className="space-y-2">
          <div className="relative rounded-2xl border-2 border-emerald-500/80 overflow-hidden bg-slate-950 shadow-md group">
            {/* Top Cover Pill */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-white text-[11px] font-bold shadow-md">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>PRIMARY COVER PHOTO</span>
            </div>

            {/* Action Bar */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-black/60 hover:bg-black/80 text-white border-white/20 text-xs backdrop-blur-md shadow-md py-1"
                leftIcon={<RefreshCw className="w-3 h-3" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Add More
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-rose-600/90 hover:bg-rose-700 text-white border-rose-500 text-xs backdrop-blur-md shadow-md py-1"
                leftIcon={<X className="w-3 h-3" />}
                onClick={() => handleRemove(0)}
                disabled={uploading}
              >
                Delete Cover
              </Button>
            </div>

            {/* Main Preview Image */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt="Primary Cover"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />
            </div>

            {/* Bottom Caption Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3.5 text-white flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <p className="font-semibold truncate">
                  {coverImage.startsWith('data:') ? 'Custom Uploaded Photo' : coverImage.split('/').pop()?.split('?')[0] || 'Cover Image'}
                </p>
                <p className="text-[10px] text-slate-300">
                  Featured on search cards, category listings, and package detail banners.
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-white border border-white/20">
                Photo 1 of {imageList.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Gallery Thumbnails & Reordering Grid ───────────────────── */}
      {imageList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Listing Gallery ({imageList.length} photo{imageList.length > 1 ? 's' : ''})
            </span>
            <span className="text-[11px] text-slate-500">
              Click &quot;Make Cover&quot; on any photo to set as primary cover
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {imageList.map((url, idx) => {
              const isCover = idx === 0;
              return (
                <div
                  key={`${url.slice(0, 30)}-${idx}`}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all bg-slate-100 ${
                    isCover
                      ? 'border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-400 shadow-xs'
                  }`}
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Gallery item ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Index / Cover Badge */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    {isCover ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs">
                        <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" /> COVER
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    title="Remove this photo"
                    className="absolute top-1.5 right-1.5 z-10 h-6 w-6 rounded-full bg-rose-600/90 text-white flex items-center justify-center hover:bg-rose-700 shadow-sm transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Hover Reorder / Set Cover Action Controls */}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        title="Set as primary cover"
                        className="flex-1 rounded-md bg-emerald-600/95 hover:bg-emerald-700 text-white px-1.5 py-1 text-[10px] font-bold shadow-sm transition-all text-center flex items-center justify-center gap-1"
                      >
                        <Star className="w-2.5 h-2.5 fill-white" /> Make Cover
                      </button>
                    )}

                    <div className="flex items-center gap-0.5 ml-auto">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'left')}
                        title="Move left"
                        className="h-6 w-6 rounded-md bg-black/70 hover:bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === imageList.length - 1}
                        onClick={() => handleMove(idx, 'right')}
                        title="Move right"
                        className="h-6 w-6 rounded-md bg-black/70 hover:bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick "+ Add More" Tile in Grid */}
            {imageList.length < maxImages && (
              <button
                type="button"
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-4/3 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/80 hover:bg-teal-50/40 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-teal-700 transition-all cursor-pointer p-3"
              >
                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4 text-teal-600" />
                </div>
                <span className="text-[11px] font-bold">Add Photo</span>
                <span className="text-[9px] text-slate-400">({maxImages - imageList.length} left)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Add More Upload Dropzone / Link Form ───────────────────── */}
      {imageList.length < maxImages && (
        <div className="pt-1">
          {tab === 'url' ? (
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <LinkIcon className="w-4 h-4 text-teal-600" />
                <span>Add Image from Direct Web Link (Unsplash, Cloudinary, Pexels, etc.)</span>
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
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 shrink-0 text-xs"
                  leftIcon={<Check className="w-4 h-4" />}
                  onClick={handleApplyUrl}
                >
                  Add to Gallery
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                Provide public high-definition direct links ending in .jpg, .png, or .webp.
              </p>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/60 ring-4 ring-teal-500/20'
                  : displayError
                  ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                  : 'border-slate-300 bg-slate-50/50 hover:border-teal-500 hover:bg-teal-50/20'
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center py-3 space-y-2">
                  <Loader2 className="w-9 h-9 animate-spin text-teal-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">Processing & uploading images...</p>
                    <p className="text-xs text-slate-500">Auto-compressing and securing listing assets</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-inner">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">
                      {imageList.length === 0 ? 'Drag & drop photos here, or ' : 'Upload additional photos, or '}
                      <span className="text-teal-600 underline decoration-teal-300 underline-offset-2">
                        browse files
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Select multiple files at once. Supports <span className="font-semibold text-slate-700">PNG, JPG, JPEG, WEBP</span> up to 10 MB.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-200/80 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                    {imageList.length === 0 ? 'First image uploaded will be your Primary Cover Photo' : `${maxImages - imageList.length} photo slots remaining`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Error Display ───────────────────────────────────────────── */}
      {displayError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};

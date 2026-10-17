'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, ShieldCheck,
  Upload, FileText, Download, Trash2, RefreshCw, Plus, X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import { formatDate } from '@/lib/utils';
import type { DocumentType, DocumentStatus, VerificationStatus } from '@prisma/client';

interface ProviderDocumentItem {
  id: string;
  providerId: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  uploadedAt: string;
  updatedAt: string;
}

interface ProviderInfo {
  id: string;
  businessName: string;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
}

const REQUIRED_DOC_TYPES: { type: DocumentType; label: string; desc: string }[] = [
  {
    type: 'BUSINESS_REGISTRATION',
    label: 'Business Registration Certificate',
    desc: 'GST registration, MSME certificate, or Certificate of Incorporation.',
  },
  {
    type: 'GOVERNMENT_ID',
    label: 'Government ID',
    desc: 'Aadhaar card, Passport, Voter ID, or Driving License of authorized signatory.',
  },
  {
    type: 'ADDRESS_PROOF',
    label: 'Address Proof',
    desc: 'Electricity bill, Lease agreement, or Bank statement reflecting business address.',
  },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function PartnerVerificationPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [documents, setDocuments] = useState<ProviderDocumentItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('BUSINESS_REGISTRATION');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const providerId = searchParams?.get('providerId');
      const url = providerId
        ? `/api/provider/documents?providerId=${encodeURIComponent(providerId)}`
        : '/api/provider/documents';

      const res = await fetch(url, { credentials: 'include' });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        }
        return;
      }

      if (!res.ok) {
        throw new Error(json.error || 'Failed to load verification status.');
      }

      if (json.success && json.data) {
        setIsAdmin(Boolean(json.data.isAdmin));
        setProvider(json.data.provider);
        setDocuments(json.data.documents || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred loading documents.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenUpload = (type: DocumentType) => {
    setSelectedType(type);
    setSelectedFile(null);
    setUploadError(null);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds the 10 MB maximum limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', selectedType);

    try {
      const res = await fetch('/api/provider/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload failed.');
      }

      setModalOpen(false);
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docLabel: string) => {
    if (!confirm(`Are you sure you want to remove the uploaded ${docLabel}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/provider/documents/${docId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to remove document.');
      }
      await fetchDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const docMap = new Map<DocumentType, ProviderDocumentItem>();
  documents.forEach((d) => {
    docMap.set(d.type, d);
  });

  const overallStatus: VerificationStatus = provider?.verificationStatus || 'UNVERIFIED';

  return (
    <div className="space-y-8">
      {/* Prominent Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5 text-rose-700">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span className="font-semibold text-sm">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDocuments(true)}
            className="text-rose-700 border-rose-300 hover:bg-rose-100 shrink-0 self-start sm:self-center"
          >
            Retry Loading Status
          </Button>
        </div>
      )}

      {/* Administrator View Banner (when admin opens verification page without a specific provider) */}
      {isAdmin && !provider && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Administrator Console</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  ADMIN VIEW
                </span>
              </div>
              <p className="text-sm text-slate-600">
                You are currently signed in as an Administrator (<code>admin@vibemiles.com</code>). Tour operators upload their statutory KYC documents here for compliance verification. To inspect, approve, or reject tour operator verification dossiers, please use the centralized tour operators management portal.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link href="/admin/providers">
                  <Button variant="primary" size="md">
                    Open Tour Operators Console
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant="outline" size="md">
                    Admin Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Mode Header (when admin is inspecting a specific provider via ?providerId=...) */}
      {isAdmin && provider && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Administrator Inspection Mode</p>
              <p className="text-sm font-bold text-slate-900">Inspecting Operator: {provider.businessName} (ID: {provider.id})</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/admin/providers">
              <Button variant="outline" size="sm">
                Return to Operator Directory
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Top Status Card */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 space-y-4 ${
          overallStatus === 'VERIFIED'
            ? 'bg-emerald-50 border-emerald-200'
            : overallStatus === 'REJECTED'
            ? 'bg-rose-50 border-rose-200'
            : overallStatus === 'PENDING'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${
              overallStatus === 'VERIFIED'
                ? 'text-emerald-600'
                : overallStatus === 'REJECTED'
                ? 'text-rose-600'
                : overallStatus === 'PENDING'
                ? 'text-amber-600'
                : 'text-slate-500'
            }`}
          >
            {overallStatus === 'VERIFIED' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : overallStatus === 'REJECTED' ? (
              <XCircle className="w-6 h-6" />
            ) : overallStatus === 'PENDING' ? (
              <Clock className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                {overallStatus === 'VERIFIED' && 'Verified & Approved Partner'}
                {overallStatus === 'REJECTED' && 'Verification Action Required'}
                {overallStatus === 'PENDING' && 'Verification Under Review'}
                {overallStatus === 'UNVERIFIED' && 'Verification Not Started'}
              </h2>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  overallStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : overallStatus === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800'
                    : overallStatus === 'PENDING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {overallStatus}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {overallStatus === 'VERIFIED' &&
                'Your business has been authenticated and approved by the VibeMiles compliance team. Your published tour packages are live.'}
              {overallStatus === 'REJECTED' &&
                (provider?.rejectionReason
                  ? `Submission feedback: ${provider.rejectionReason}. Please re-upload the corrected documents below.`
                  : 'One or more submitted documents did not meet requirements. Please review the feedback below.')}
              {overallStatus === 'PENDING' &&
                'Your submitted documents are currently being reviewed by our administrative team. Reviews typically complete within 1-2 business days.'}
              {overallStatus === 'UNVERIFIED' &&
                'You have not uploaded the required business documents yet. Please submit your Business Registration, Government ID, and Address Proof to begin KYC verification.'}
            </p>
          </div>
        </div>

        {overallStatus === 'VERIFIED' && (
          <div className="pt-2">
            <Link href={ROUTES.PROVIDER_DASHBOARD}>
              <Button variant="primary" size="md">
                Go to Partner Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Verification Checklist */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Verification Checklist</h3>
            <p className="text-xs text-slate-500">
              Upload all 3 required documents. An administrator will review and verify each document individually.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDocuments(true)}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Status
          </Button>
        </div>

        <div className="space-y-3">
          {REQUIRED_DOC_TYPES.map((req) => {
            const uploadedDoc = docMap.get(req.type);
            const isVerified = uploadedDoc?.status === 'VERIFIED';
            const isPending = uploadedDoc?.status === 'PENDING';
            const isRejected = uploadedDoc?.status === 'REJECTED';
            const notUploaded = !uploadedDoc;

            return (
              <div
                key={req.type}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-slate-200"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-full ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-600'
                        : isPending
                        ? 'bg-amber-100 text-amber-600'
                        : isRejected
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isPending ? (
                      <Clock className="w-5 h-5" />
                    ) : isRejected ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{req.label}</p>
                    <p className="text-xs text-slate-500">
                      {isVerified && 'Approved by Administrator'}
                      {isPending && 'Submitted — Pending review'}
                      {isRejected && `Rejected: ${uploadedDoc.rejectionReason || 'Please re-upload a valid document.'}`}
                      {notUploaded && 'Not uploaded'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:self-center">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : isPending
                        ? 'bg-amber-100 text-amber-800'
                        : isRejected
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isVerified && 'Verified ✓'}
                    {isPending && 'Submitted — In Review'}
                    {isRejected && 'Action Required'}
                    {notUploaded && 'Not Uploaded'}
                  </span>

                  {(notUploaded || isRejected) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenUpload(req.type)}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      {isRejected ? 'Re-upload' : 'Upload'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Admin Review Step */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-full ${
                  overallStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-600'
                    : overallStatus === 'PENDING'
                    ? 'bg-amber-100 text-amber-600'
                    : overallStatus === 'REJECTED'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {overallStatus === 'VERIFIED' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : overallStatus === 'PENDING' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Admin Review</p>
                <p className="text-xs text-slate-500">
                  {overallStatus === 'VERIFIED' && 'All documents verified by administrator'}
                  {overallStatus === 'PENDING' && 'In Progress — Admin reviewing submitted documents'}
                  {overallStatus === 'REJECTED' && 'Review Completed — Action required on rejected items'}
                  {overallStatus === 'UNVERIFIED' && 'Waiting for document submission'}
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                overallStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : overallStatus === 'PENDING'
                  ? 'bg-amber-100 text-amber-800'
                  : overallStatus === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {overallStatus === 'VERIFIED' && 'Complete'}
              {overallStatus === 'PENDING' && 'In Review'}
              {overallStatus === 'REJECTED' && 'Action Required'}
              {overallStatus === 'UNVERIFIED' && 'Waiting'}
            </span>
          </div>

          {/* Listing Approval Step */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3.5">
              <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-slate-200 text-slate-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Listing Approval</p>
                <p className="text-xs text-slate-500">
                  Independent of business KYC. Each published tour listing is reviewed separately for itinerary quality and guest safety.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
              Independent
            </span>
          </div>
        </div>
      </div>

      {/* Uploaded Documents Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Uploaded Documents</h3>
            <p className="text-xs text-slate-500">
              Real stored documents associated with your provider account.
            </p>
          </div>
          {documents.length < REQUIRED_DOC_TYPES.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenUpload('BUSINESS_REGISTRATION')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Upload Document
            </Button>
          )}
        </div>


        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No documents uploaded yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please upload your Business Registration Certificate, Government ID, and Address Proof to begin KYC verification.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const typeInfo = REQUIRED_DOC_TYPES.find((r) => r.type === doc.type);
              const label = typeInfo?.label || doc.type.replace(/_/g, ' ');

              return (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-900 truncate">{label}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {doc.fileName} · {formatBytes(doc.fileSize)} · Uploaded {formatDate(doc.uploadedAt)}
                      </p>
                      {doc.rejectionReason && (
                        <p className="text-xs text-rose-600 mt-0.5 font-medium">
                          Feedback: {doc.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        doc.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status === 'VERIFIED' && 'Verified ✓'}
                      {doc.status === 'PENDING' && 'Submitted — Pending review'}
                      {doc.status === 'REJECTED' && 'Rejected'}
                    </span>

                    {/* Authorized download link */}
                    <a
                      href={`/api/provider/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View
                    </a>

                    {doc.status !== 'VERIFIED' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, label)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-700" /> Upload Verification Document
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Document Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  {REQUIRED_DOC_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select File (PDF, PNG, JPG, WEBP — Max 10 MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-xs font-medium text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-700 file:text-white hover:file:bg-teal-800 cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Selected: <span className="font-semibold text-slate-800">{selectedFile.name}</span> ({formatBytes(selectedFile.size)})
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {uploadError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={uploading}
                  disabled={!selectedFile || uploading}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Upload File
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

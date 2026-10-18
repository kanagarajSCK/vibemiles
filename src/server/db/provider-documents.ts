import { prisma } from '@/lib/prisma';
import {
  DocumentType,
  DocumentStatus,
  VerificationStatus,
  UserRole,
  NotificationType,
} from '@prisma/client';
import {
  saveDocumentFile,
  readDocumentFile,
  deleteDocumentFile,
} from '@/server/storage/document-storage';
import { recordAuditLog } from './admin';
import { createNotificationInDb } from './notifications';

export { DocumentType, DocumentStatus };

export interface SanitizedProviderDocument {
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

const REQUIRED_DOC_TYPES: DocumentType[] = [
  DocumentType.BUSINESS_REGISTRATION,
  DocumentType.GOVERNMENT_ID,
  DocumentType.ADDRESS_PROOF,
];

/**
 * Recomputes the overall verification status of a provider profile
 * based strictly on real uploaded document records.
 * 
 * Rules:
 * - 0 documents uploaded => UNVERIFIED
 * - Any document REJECTED => REJECTED (with rejection reason)
 * - All 3 required documents (BUSINESS_REGISTRATION, GOVERNMENT_ID, ADDRESS_PROOF)
 *   present AND verified by an admin => VERIFIED
 * - Any document PENDING or incomplete required documents => PENDING
 * - Never auto-verifies or retains VERIFIED status if required documents are missing or pending.
 */
export async function recomputeProviderVerificationStatus(providerId: string): Promise<VerificationStatus> {
  const documents = await prisma.providerDocument.findMany({
    where: { providerId },
  });

  if (documents.length === 0) {
    await prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        verificationStatus: VerificationStatus.UNVERIFIED,
        rejectionReason: null,
      },
    });
    return VerificationStatus.UNVERIFIED;
  }

  const hasAnyRejected = documents.some((d) => d.status === DocumentStatus.REJECTED);
  const hasAnyPending = documents.some((d) => d.status === DocumentStatus.PENDING);

  // Check if all 3 required document types exist and are admin-approved (VERIFIED)
  const verifiedDocTypes = new Set(
    documents.filter((d) => d.status === DocumentStatus.VERIFIED).map((d) => d.type)
  );
  const hasAllRequiredVerified = REQUIRED_DOC_TYPES.every((type) => verifiedDocTypes.has(type));

  let newStatus: VerificationStatus = VerificationStatus.UNVERIFIED;
  let rejectionReason: string | null = null;

  if (hasAnyRejected) {
    newStatus = VerificationStatus.REJECTED;
    const rejectedDoc = documents.find((d) => d.status === DocumentStatus.REJECTED);
    rejectionReason = rejectedDoc?.rejectionReason || 'One or more required verification documents were rejected by the admin team.';
  } else if (hasAllRequiredVerified) {
    // Only verified when all 3 required documents are approved by an admin
    newStatus = VerificationStatus.VERIFIED;
  } else if (hasAnyPending || documents.length > 0) {
    // Documents are uploaded or pending review, but not all 3 are verified yet
    newStatus = VerificationStatus.PENDING;
  } else {
    newStatus = VerificationStatus.UNVERIFIED;
  }

  await prisma.providerProfile.update({
    where: { id: providerId },
    data: {
      verificationStatus: newStatus,
      rejectionReason: newStatus === VerificationStatus.REJECTED ? rejectionReason : null,
    },
  });

  return newStatus;
}

/**
 * Retrieves all uploaded documents for the authenticated provider or admin.
 */
export async function getProviderDocumentsForUser(
  userId: string,
  userRole?: string
): Promise<{
  provider: {
    id: string;
    businessName: string;
    verificationStatus: VerificationStatus;
    rejectionReason: string | null;
  } | null;
  documents: SanitizedProviderDocument[];
  isAdmin?: boolean;
}> {
  let provider = await prisma.providerProfile.findUnique({
    where: { userId },
    include: {
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  const isAdmin = userRole?.toUpperCase() === UserRole.ADMIN;

  // If user is ADMIN and has no provider profile, return clean state without throwing 400!
  if (!provider && isAdmin) {
    return {
      provider: null,
      documents: [],
      isAdmin: true,
    };
  }

  // If user is a PROVIDER role but profile is missing, automatically initialize it
  if (!provider) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === UserRole.PROVIDER) {
      provider = await prisma.providerProfile.create({
        data: {
          userId,
          businessName: 'My Travel Business',
          ownerName: 'Tour Operator',
          businessCategory: 'Tour Operator',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
        include: {
          documents: true,
        },
      });
    }
  }

  if (!provider) {
    throw new Error('Provider profile not found for this account.');
  }

  const sanitizedDocs: SanitizedProviderDocument[] = provider.documents.map((d) => ({
    id: d.id,
    providerId: d.providerId,
    type: d.type,
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    status: d.status,
    rejectionReason: d.rejectionReason,
    reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
    uploadedAt: d.uploadedAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return {
    provider: {
      id: provider.id,
      businessName: provider.businessName,
      verificationStatus: provider.verificationStatus,
      rejectionReason: provider.rejectionReason,
    },
    documents: sanitizedDocs,
    isAdmin,
  };
}

/**
 * Handles genuine document upload by the authenticated provider.
 */
export async function uploadProviderDocumentForUser(params: {
  userId: string;
  providerId?: string;
  type: DocumentType;
  fileBuffer?: Buffer;
  buffer?: Buffer;
  originalFileName?: string;
  fileName?: string;
  mimeType: string;
}): Promise<SanitizedProviderDocument> {
  const { userId, type, mimeType } = params;
  const fileBuffer = params.fileBuffer || params.buffer;
  const originalFileName = params.originalFileName || params.fileName || 'document.pdf';

  if (!fileBuffer) {
    throw new Error('No file buffer provided for upload.');
  }

  // 1. Authorize: Ensure provider profile exists for this authenticated user or provided providerId
  let provider = params.providerId
    ? await prisma.providerProfile.findUnique({ where: { id: params.providerId } })
    : await prisma.providerProfile.findUnique({ where: { userId } });

  if (!provider) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === UserRole.PROVIDER) {
      provider = await prisma.providerProfile.create({
        data: {
          userId,
          businessName: 'My Travel Business',
          ownerName: 'Tour Operator',
          businessCategory: 'Tour Operator',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
      });
    }
  }

  if (!provider) {
    throw new Error('Access denied: No provider profile associated with this account.');
  }

  // 2. Check for existing document of this type
  const existingDoc = await prisma.providerDocument.findUnique({
    where: {
      providerId_type: {
        providerId: provider.id,
        type,
      },
    },
  });

  // 3. Save actual file to private storage
  const storageResult = await saveDocumentFile({
    providerId: provider.id,
    documentType: type,
    originalFileName,
    buffer: fileBuffer,
    mimeType,
  });

  // 4. Delete old file if updating
  if (existingDoc && existingDoc.filePath) {
    await deleteDocumentFile(existingDoc.filePath).catch(() => null);
  }

  // 5. Persist real metadata in PostgreSQL
  const docRecord = await prisma.providerDocument.upsert({
    where: {
      providerId_type: {
        providerId: provider.id,
        type,
      },
    },
    update: {
      fileName: originalFileName,
      fileSize: storageResult.fileSize,
      mimeType,
      filePath: storageResult.relativePath,
      status: DocumentStatus.PENDING,
      rejectionReason: null,
      reviewedByAdminId: null,
      reviewedAt: null,
      updatedAt: new Date(),
    },
    create: {
      providerId: provider.id,
      type,
      fileName: originalFileName,
      fileSize: storageResult.fileSize,
      mimeType,
      filePath: storageResult.relativePath,
      status: DocumentStatus.PENDING,
    },
  });

  // 6. Recompute provider's overall verification status
  await recomputeProviderVerificationStatus(provider.id);

  return {
    id: docRecord.id,
    providerId: docRecord.providerId,
    type: docRecord.type,
    fileName: docRecord.fileName,
    fileSize: docRecord.fileSize,
    mimeType: docRecord.mimeType,
    status: docRecord.status,
    rejectionReason: docRecord.rejectionReason,
    reviewedAt: docRecord.reviewedAt ? docRecord.reviewedAt.toISOString() : null,
    uploadedAt: docRecord.uploadedAt.toISOString(),
    updatedAt: docRecord.updatedAt.toISOString(),
  };
}

/**
 * Deletes an uploaded document for the authenticated provider.
 */
export async function deleteProviderDocumentForUser(params: {
  userId: string;
  documentId: string;
}): Promise<boolean> {
  const { userId, documentId } = params;

  const doc = await prisma.providerDocument.findUnique({
    where: { id: documentId },
    include: { provider: true },
  });

  if (!doc) {
    throw new Error('Document not found.');
  }

  // IDOR protection: strictly enforce that document belongs to authenticated user's provider profile
  if (doc.provider.userId !== userId) {
    throw new Error('Access denied: You do not have permission to delete this document.');
  }

  // Remove file from storage
  await deleteDocumentFile(doc.filePath).catch(() => null);

  // Delete DB record
  await prisma.providerDocument.delete({
    where: { id: documentId },
  });

  // Recompute provider status
  await recomputeProviderVerificationStatus(doc.providerId);

  return true;
}

/**
 * Retrieves a document file for secure download/viewing with strict ownership check.
 */
export async function getDocumentFileForDownload(params: {
  userId: string;
  userRole: string;
  documentId: string;
}): Promise<{
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}> {
  const { userId, userRole, documentId } = params;

  const doc = await prisma.providerDocument.findUnique({
    where: { id: documentId },
    include: { provider: true },
  });

  if (!doc) {
    throw new Error('Document not found.');
  }

  // Ownership verification: Admin can access any document; Provider can ONLY access their own
  const isAdmin = userRole?.toUpperCase() === 'ADMIN';
  const isOwner = doc.provider.userId === userId;

  if (!isAdmin && !isOwner) {
    throw new Error('Access denied: You do not have permission to view this document.');
  }

  const buffer = await readDocumentFile(doc.filePath);

  return {
    buffer,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
  };
}

/**
 * Retrieves all documents for a specific provider (Admin only).
 */
export async function getProviderDocumentsForAdmin(providerId: string): Promise<{
  provider: {
    id: string;
    businessName: string;
    ownerName: string;
    verificationStatus: VerificationStatus;
    rejectionReason: string | null;
  };
  documents: SanitizedProviderDocument[];
}> {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: {
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!provider) {
    throw new Error('Provider not found.');
  }

  const sanitizedDocs: SanitizedProviderDocument[] = provider.documents.map((d) => ({
    id: d.id,
    providerId: d.providerId,
    type: d.type,
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    status: d.status,
    rejectionReason: d.rejectionReason,
    reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
    uploadedAt: d.uploadedAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return {
    provider: {
      id: provider.id,
      businessName: provider.businessName,
      ownerName: provider.ownerName,
      verificationStatus: provider.verificationStatus,
      rejectionReason: provider.rejectionReason,
    },
    documents: sanitizedDocs,
  };
}

/**
 * Reviews (approves or rejects) an individual provider document (Admin only).
 */
export async function reviewProviderDocumentByAdmin(params: {
  adminUserId?: string;
  adminEmail?: string;
  adminUser?: { id: string; email: string };
  documentId: string;
  status: 'VERIFIED' | 'REJECTED';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<SanitizedProviderDocument> {
  const adminUserId = params.adminUserId || params.adminUser?.id || '';
  const adminEmail = params.adminEmail || params.adminUser?.email || '';
  const { documentId, status, reason, ipAddress, userAgent } = params;

  if (status === 'REJECTED' && (!reason || reason.trim().length === 0)) {
    throw new Error('A rejection reason is strictly required when rejecting a verification document.');
  }

  const doc = await prisma.providerDocument.findUnique({
    where: { id: documentId },
    include: { provider: { include: { user: true } } },
  });

  if (!doc) {
    throw new Error('Verification document not found.');
  }

  const updatedDoc = await prisma.providerDocument.update({
    where: { id: documentId },
    data: {
      status: status === 'VERIFIED' ? DocumentStatus.VERIFIED : DocumentStatus.REJECTED,
      rejectionReason: status === 'REJECTED' ? reason?.trim() : null,
      reviewedByAdminId: adminUserId,
      reviewedAt: new Date(),
    },
  });

  // Recompute provider's overall verification status
  const newOverallStatus = await recomputeProviderVerificationStatus(doc.providerId);

  // Record audit log
  await recordAuditLog({
    actorId: adminUserId,
    actorEmail: adminEmail,
    actorRole: UserRole.ADMIN,
    action: status === 'VERIFIED' ? 'DOCUMENT_VERIFY' : 'DOCUMENT_REJECT',
    targetType: 'ProviderDocument',
    targetId: documentId,
    reason: status === 'REJECTED' ? reason?.trim() : `Document ${doc.type} verified`,
    metadata: {
      providerId: doc.providerId,
      documentType: doc.type,
      newDocumentStatus: status,
      newProviderStatus: newOverallStatus,
    },
    ipAddress,
    userAgent,
  });

  // Send notification to provider
  const notifType = status === 'VERIFIED' ? NotificationType.PROVIDER_VERIFIED : NotificationType.PROVIDER_REJECTED;
  const notifTitle = status === 'VERIFIED' ? 'Document Verified' : 'Document Rejected';
  const notifMessage = status === 'VERIFIED'
    ? `Your ${doc.type.replace(/_/g, ' ')} has been verified and approved by the admin team.`
    : `Your ${doc.type.replace(/_/g, ' ')} was rejected. Reason: ${reason}`;

  await createNotificationInDb({
    userId: doc.provider.userId,
    type: notifType,
    title: notifTitle,
    message: notifMessage,
  }).catch(() => null);

  return {
    id: updatedDoc.id,
    providerId: updatedDoc.providerId,
    type: updatedDoc.type,
    fileName: updatedDoc.fileName,
    fileSize: updatedDoc.fileSize,
    mimeType: updatedDoc.mimeType,
    status: updatedDoc.status,
    rejectionReason: updatedDoc.rejectionReason,
    reviewedAt: updatedDoc.reviewedAt ? updatedDoc.reviewedAt.toISOString() : null,
    uploadedAt: updatedDoc.uploadedAt.toISOString(),
    updatedAt: updatedDoc.updatedAt.toISOString(),
  };
}

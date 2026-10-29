import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';

// Detect serverless environment (Vercel, AWS Lambda)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Root directory for secure documents (outside of public/ web root)
// On Vercel / Lambda, /var/task is read-only, so os.tmpdir() is used as the writable root.
const STORAGE_ROOT =
  process.env.STORAGE_PATH ||
  (isServerless
    ? path.join(os.tmpdir(), 'vibemiles_storage', 'secure_documents')
    : path.join(process.cwd(), 'storage', 'secure_documents'));

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

/**
 * Validates file magic bytes (file signature) to ensure content matches MIME type.
 */
export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  switch (mimeType) {
    case 'application/pdf':
      // %PDF-
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );
    case 'image/png':
      // \x89PNG\r\n\x1a\n
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case 'image/jpeg':
      // \xFF\xD8\xFF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/webp':
      // RIFF....WEBP
      if (buffer.length < 12) return false;
      const riff = buffer.subarray(0, 4).toString('ascii');
      const webp = buffer.subarray(8, 12).toString('ascii');
      return riff === 'RIFF' && webp === 'WEBP';
    default:
      return false;
  }
}

/**
 * Ensures the target storage folder exists.
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    // If writing to process.cwd() failed with read-only filesystem, fallback to os.tmpdir()
    if (!dirPath.startsWith(os.tmpdir())) {
      const fallbackDir = path.join(os.tmpdir(), 'vibemiles_storage', 'secure_documents');
      await fs.mkdir(fallbackDir, { recursive: true });
    } else {
      throw err;
    }
  }
}

/**
 * Saves an uploaded document buffer to secure storage.
 * Enforces provider directory isolation and filename sanitization.
 */
export async function saveDocumentFile(params: {
  providerId: string;
  documentType: string;
  originalFileName: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{ relativePath: string; absolutePath: string; fileSize: number }> {
  const { providerId, documentType, originalFileName, buffer, mimeType } = params;

  // 1. Validate file size
  if (buffer.length === 0) {
    throw new Error('Uploaded file is empty.');
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB.`);
  }

  // 2. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    throw new Error(`Invalid file type "${mimeType}". Allowed types: PDF, PNG, JPEG, WEBP.`);
  }

  // 3. Validate Magic Bytes
  if (!validateMagicBytes(buffer, mimeType)) {
    throw new Error(`File content does not match the declared MIME type "${mimeType}".`);
  }

  // 4. Sanitize file extension and generate secure filename
  const rawExt = path.extname(originalFileName).toLowerCase();
  const safeExt = rawExt && /^\.[a-z0-9]+$/i.test(rawExt) ? rawExt : '.bin';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const secureFileName = `${documentType.toLowerCase()}_${timestamp}_${randomSuffix}${safeExt}`;

  // 5. Provider-isolated storage directory
  const providerDir = path.join(STORAGE_ROOT, providerId);
  await ensureDir(providerDir);

  const absolutePath = path.join(providerDir, secureFileName);
  await fs.writeFile(absolutePath, buffer);

  // Return relative path for portability across environments
  const relativePath = path.join('storage', 'secure_documents', providerId, secureFileName);

  return {
    relativePath,
    absolutePath,
    fileSize: buffer.length,
  };
}

/**
 * Reads a document buffer from secure storage.
 */
export async function readDocumentFile(filePath: string): Promise<Buffer> {
  let resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);

  if (!fsSync.existsSync(resolvedPath) && !path.isAbsolute(filePath)) {
    const tmpCandidate = path.join(STORAGE_ROOT, path.basename(filePath));
    if (fsSync.existsSync(tmpCandidate)) {
      resolvedPath = tmpCandidate;
    }
  }

  // Security check: Ensure path does not escape STORAGE_ROOT or process.cwd()
  const normalizedPath = path.normalize(resolvedPath);
  const normalizedRoot = path.normalize(STORAGE_ROOT);
  const normalizedCwd = path.normalize(process.cwd());
  const normalizedTmp = path.normalize(os.tmpdir());

  const isSafe =
    normalizedPath.startsWith(normalizedRoot) ||
    normalizedPath.startsWith(normalizedCwd) ||
    normalizedPath.startsWith(normalizedTmp);

  if (!isSafe) {
    throw new Error('Access denied: Invalid file storage location.');
  }

  return await fs.readFile(normalizedPath);
}

/**
 * Deletes a document file from secure storage.
 */
export async function deleteDocumentFile(filePath: string): Promise<boolean> {
  try {
    let resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);

    if (!fsSync.existsSync(resolvedPath) && !path.isAbsolute(filePath)) {
      const tmpCandidate = path.join(STORAGE_ROOT, path.basename(filePath));
      if (fsSync.existsSync(tmpCandidate)) {
        resolvedPath = tmpCandidate;
      }
    }

    const normalizedPath = path.normalize(resolvedPath);
    const normalizedRoot = path.normalize(STORAGE_ROOT);
    const normalizedCwd = path.normalize(process.cwd());
    const normalizedTmp = path.normalize(os.tmpdir());

    const isSafe =
      normalizedPath.startsWith(normalizedRoot) ||
      normalizedPath.startsWith(normalizedCwd) ||
      normalizedPath.startsWith(normalizedTmp);

    if (!isSafe) {
      return false;
    }

    if (fsSync.existsSync(normalizedPath)) {
      await fs.unlink(normalizedPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

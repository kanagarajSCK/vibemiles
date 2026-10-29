import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import fs from 'fs/promises';
import path from 'path';
import { validateMagicBytes } from '@/server/storage/document-storage';

export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB limit

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(['provider', 'admin']);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'An image file is required.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mimeType = file.type?.toLowerCase() || '';
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid image type "${mimeType}". Allowed formats: PNG, JPG, JPEG, WEBP.` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `Image size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 10 MB limit.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes
    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: 'Corrupt or mismatched image content. Please upload a valid image file.' },
        { status: 400 }
      );
    }

    // Generate safe filename and target path
    const rawExt = path.extname(file.name).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt)
      ? rawExt
      : mimeType === 'image/png'
      ? '.png'
      : mimeType === 'image/webp'
      ? '.webp'
      : '.jpg';

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueFileName = `pkg_${auth.user.id}_${timestamp}_${randomSuffix}${safeExt}`;

    let publicUrl: string;

    // Detect serverless environments (Vercel, AWS Lambda) where process.cwd() is read-only
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (!isServerless) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'packages');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, uniqueFileName);
        await fs.writeFile(filePath, buffer);
        publicUrl = `/uploads/packages/${uniqueFileName}`;
      } catch (fsErr) {
        // Fallback gracefully to base64 Data URL if filesystem write is blocked or fails
        console.warn('Local filesystem write failed, using data URL fallback:', fsErr);
        publicUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      }
    } else {
      // In serverless runtimes (Vercel / Lambda), local disk is read-only.
      // Use standard high-efficiency base64 Data URL that is directly accepted by DB and Next.js Image.
      publicUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: buffer.length,
      mimeType,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Image upload failed.';
    console.error('Package image upload error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

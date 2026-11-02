import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getPackagesForProvider, createPackage, CreatePackageInput } from '@/server/db/packages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/packages
 * Returns all listings belonging to the authenticated provider.
 */
export async function GET() {
  try {
    const auth = await requireRole(['provider']);
    const packages = await getPackagesForProvider(auth.user.id);

    return NextResponse.json({
      success: true,
      count: packages.length,
      packages,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in GET /api/provider/packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve provider listings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider/packages
 * Creates a new package listing for the authenticated provider.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(['provider']);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Package title must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!body.description || typeof body.description !== 'string' || body.description.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Description must be at least 10 characters' },
        { status: 400 }
      );
    }

    const input: CreatePackageInput = {
      name: body.name.trim(),
      description: body.description.trim(),
      categoryId: body.categoryId,
      categorySlug: body.categorySlug || body.category,
      destinationId: body.destinationId,
      destinationName: body.destinationName || body.destinationCity || body.destination,
      state: body.destinationState || body.state || 'India',
      city: body.destinationCity || body.city,
      durationDays: Number(body.durationDays) || 1,
      durationNights: Number(body.durationNights) ?? Math.max(0, (Number(body.durationDays) || 1) - 1),
      maxGroupSize: Number(body.maxGroupSize) || 10,
      basePrice: Number(body.basePrice) || 0,
      discountPercent: Number(body.discountPercent) || 0,
      currency: body.currency || 'INR',
      images: Array.isArray(body.images) ? body.images : [],
      videoUrl: body.videoUrl,
      itinerary: Array.isArray(body.itinerary) ? body.itinerary : undefined,
      inclusions: Array.isArray(body.inclusions)
        ? body.inclusions
        : typeof body.inclusions === 'string'
        ? body.inclusions.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : undefined,
      exclusions: Array.isArray(body.exclusions)
        ? body.exclusions
        : typeof body.exclusions === 'string'
        ? body.exclusions.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : undefined,
      availableDates: Array.isArray(body.availableDates) ? body.availableDates : undefined,
      cancellationPolicy: body.cancellationPolicy,
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
      status: body.submitForReview ? 'PENDING_REVIEW' : 'DRAFT',
    };

    const newPackage = await createPackage(auth.user.id, input);

    return NextResponse.json(
      {
        success: true,
        message: body.submitForReview
          ? 'Package created and submitted for review'
          : 'Package draft created successfully',
        package: newPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to create package';
    console.error('API Error in POST /api/provider/packages:', error);
    const status = message.includes('KYC') || message.includes('verification') ? 403 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

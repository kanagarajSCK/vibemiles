import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import {
  getPackageByIdForProvider,
  updatePackage,
  UpdatePackageInput,
} from '@/server/db/packages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/packages/[id]
 * Retrieves a specific package for the authenticated provider.
 * IDOR Protected: returns 404 if package belongs to someone else.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['provider']);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    const pkg = await getPackageByIdForProvider(id, auth.user.id);
    if (!pkg) {
      return NextResponse.json(
        { success: false, error: 'Package not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in GET /api/provider/packages/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve package' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/provider/packages/[id]
 * Updates an existing package for the authenticated provider.
 * IDOR Protected: verifies ownership.
 * Moderation Protected: if listing was approved/published, resets to PENDING_REVIEW.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['provider']);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const input: UpdatePackageInput = {
      name: typeof body.name === 'string' ? body.name.trim() : undefined,
      description: typeof body.description === 'string' ? body.description.trim() : undefined,
      categoryId: body.categoryId,
      categorySlug: body.categorySlug || body.category,
      destinationId: body.destinationId,
      destinationName: body.destinationName || body.destinationCity || body.destination,
      state: body.destinationState || body.state,
      city: body.destinationCity || body.city,
      durationDays: body.durationDays !== undefined ? Number(body.durationDays) : undefined,
      durationNights: body.durationNights !== undefined ? Number(body.durationNights) : undefined,
      maxGroupSize: body.maxGroupSize !== undefined ? Number(body.maxGroupSize) : undefined,
      basePrice: body.basePrice !== undefined ? Number(body.basePrice) : undefined,
      discountPercent: body.discountPercent !== undefined ? Number(body.discountPercent) : undefined,
      currency: body.currency,
      images: Array.isArray(body.images) ? body.images : undefined,
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
      highlights: Array.isArray(body.highlights) ? body.highlights : undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      submitForReview: Boolean(body.submitForReview),
      unarchive: Boolean(body.unarchive),
    };

    const updated = await updatePackage(id, auth.user.id, input);

    return NextResponse.json({
      success: true,
      message: 'Package updated successfully',
      package: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to update package';
    const statusCode = message.includes('access denied') || message.includes('not found') ? 404 : 400;
    console.error('API Error in PUT /api/provider/packages/[id]:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}

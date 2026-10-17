import { prisma } from '@/lib/prisma';
import { VerificationStatus } from '@prisma/client';
import { handleDbError } from './errors';
import { MOCK_PROVIDERS } from '@/lib/mock-data';
import type { Provider, BusinessCategory, VerificationStatus as DomainVerificationStatus } from '@/types';

/**
 * Retrieves a provider profile by provider ID or associated user ID.
 */
export async function getProviderById(id: string): Promise<Provider | null> {
  try {
    const record = await prisma.providerProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: true,
      },
    });

    if (!record) return null;

    return {
      id: record.id,
      email: record.user.email,
      phone: record.user.phone || '',
      role: 'provider',
      businessName: record.businessName,
      ownerName: record.ownerName,
      businessCategory: (record.businessCategory as BusinessCategory) || 'Tour Organizer',
      description: record.description ?? undefined,
      logo: record.logo ?? undefined,
      gallery: record.gallery,
      address: {
        line1: record.addressLine1 || '',
        city: record.city,
        state: record.state,
        pincode: record.pincode,
        country: record.country,
      },
      verificationStatus: record.verificationStatus.toLowerCase() as DomainVerificationStatus,
      isActive: record.isActive,
      rating: record.rating,
      reviewCount: record.reviewCount,
      totalPackages: record.totalPackages,
      joinedAt: record.joinedAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  } catch (error) {
    return handleDbError(error, `getProviderById(${id})`, () => {
      const found = MOCK_PROVIDERS.find((p) => p.id === id || p.businessName.toLowerCase() === id.toLowerCase());
      return found ?? null;
    });
  }
}

/**
 * Retrieves all verified and active providers.
 */
export async function getVerifiedProviders(limit = 20): Promise<Provider[]> {
  try {
    const records = await prisma.providerProfile.findMany({
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: {
        user: true,
      },
    });

    return records.map((record) => ({
      id: record.id,
      email: record.user.email,
      phone: record.user.phone || '',
      role: 'provider',
      businessName: record.businessName,
      ownerName: record.ownerName,
      businessCategory: (record.businessCategory as BusinessCategory) || 'Tour Organizer',
      description: record.description ?? undefined,
      logo: record.logo ?? undefined,
      gallery: record.gallery,
      address: {
        line1: record.addressLine1 || '',
        city: record.city,
        state: record.state,
        pincode: record.pincode,
        country: record.country,
      },
      verificationStatus: record.verificationStatus.toLowerCase() as DomainVerificationStatus,
      isActive: record.isActive,
      rating: record.rating,
      reviewCount: record.reviewCount,
      totalPackages: record.totalPackages,
      joinedAt: record.joinedAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));
  } catch (error) {
    return handleDbError(error, 'getVerifiedProviders', () => {
      return MOCK_PROVIDERS.filter((p) => p.verificationStatus === 'verified').slice(0, limit);
    });
  }
}

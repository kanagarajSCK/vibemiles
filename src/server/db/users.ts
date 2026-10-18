import { prisma } from '@/lib/prisma';
import { UserRole, UserStatus, VerificationStatus } from '@prisma/client';
import { hashPassword } from '@/server/auth/password';

export interface CreateCustomerParams {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface CreateProviderParams {
  fullName?: string;
  ownerName?: string;
  email: string;
  phone?: string;
  password: string;
  businessName?: string;
  businessCategory?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/**
 * Normalizes email address for consistent unique lookups.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalizes phone number (strips formatting characters).
 */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.length > 0 ? digits : null;
}

/**
 * Finds user by email or phone including profiles and passwordHash.
 * Server-only for internal credential checks.
 */
export async function findUserForAuth(identifier: string) {
  const trimmed = identifier.trim();

  // If identifier contains '@', it is strictly an email address.
  // Never query phone numbers when an email is provided to avoid matching users by digits in emails.
  if (trimmed.includes('@')) {
    const normalized = normalizeEmail(trimmed);
    return prisma.user.findFirst({
      where: { email: normalized },
      include: {
        customerProfile: true,
        providerProfile: true,
      },
    });
  }

  // Otherwise, identifier is a phone number.
  const cleanPhone = normalizePhone(trimmed);
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!cleanPhone || digitsOnly.length < 7) {
    return null;
  }

  const tenDigit = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
  const phoneCandidates = Array.from(
    new Set([
      cleanPhone,
      digitsOnly,
      tenDigit,
      `+91${tenDigit}`,
      `+91 ${tenDigit.slice(0, 5)} ${tenDigit.slice(5)}`,
      `+91 ${tenDigit}`,
    ])
  );

  return prisma.user.findFirst({
    where: {
      phone: { in: phoneCandidates },
    },
    include: {
      customerProfile: true,
      providerProfile: true,
    },
  });
}

/**
 * Checks if an email is already registered.
 */
export async function isEmailRegistered(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const count = await prisma.user.count({
    where: { email: normalized },
  });
  return count > 0;
}

/**
 * Transactionally creates a new CUSTOMER user and associated CustomerProfile.
 * Public registration cannot create ADMIN users.
 */
export async function createCustomerUser(params: CreateCustomerParams) {
  const normalizedEmail = normalizeEmail(params.email);
  const cleanPhone = normalizePhone(params.phone);
  const passwordHash = await hashPassword(params.password);

  return prisma.$transaction(async (tx) => {
    // Check uniqueness
    const existing = await tx.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (existing) {
      throw new Error('An account with this email or phone already exists.');
    }

    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        phone: cleanPhone,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });

    const profile = await tx.customerProfile.create({
      data: {
        userId: user.id,
        fullName: params.fullName.trim(),
        rewardPoints: 100, // Welcome points
        isVerified: false, // Must not fabricate verification
        isBlocked: false,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      profile,
    };
  });
}

/**
 * Transactionally creates a new PROVIDER user and associated ProviderProfile.
 * New providers always start with verificationStatus = PENDING.
 */
export async function createProviderUser(params: CreateProviderParams) {
  const normalizedEmail = normalizeEmail(params.email);
  const cleanPhone = normalizePhone(params.phone);
  const passwordHash = await hashPassword(params.password);

  return prisma.$transaction(async (tx) => {
    // Check uniqueness
    const existing = await tx.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (existing) {
      throw new Error('An account with this email or phone already exists.');
    }

    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        phone: cleanPhone,
        passwordHash,
        role: UserRole.PROVIDER,
        status: UserStatus.ACTIVE,
      },
    });

    const profile = await tx.providerProfile.create({
      data: {
        userId: user.id,
        businessName: (params.businessName || 'My Travel Business').trim(),
        ownerName: (params.ownerName || params.fullName || 'Provider Owner').trim(),
        businessCategory: params.businessCategory || 'Tour Organizer',
        city: params.city?.trim() || 'Bengaluru',
        state: params.state?.trim() || 'Karnataka',
        pincode: params.pincode?.trim() || '560001',
        verificationStatus: VerificationStatus.UNVERIFIED, // Starts UNVERIFIED until verification documents are uploaded
        isActive: true,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      profile,
    };
  });
}

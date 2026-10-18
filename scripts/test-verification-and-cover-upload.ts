import { prisma } from '../src/lib/prisma';
import {
  uploadProviderDocumentForUser,
  recomputeProviderVerificationStatus,
  reviewProviderDocumentByAdmin,
  DocumentType,
  DocumentStatus,
} from '../src/server/db/provider-documents';
import { createProviderUser } from '../src/server/db/users';
import { createPackage } from '../src/server/db/packages';
import { reviewProviderVerificationInDb, getAdminProviders, getProviderDetailsForAdmin } from '../src/server/db/admin';
import { VerificationStatus } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// Valid 1x1 PNG buffer with valid magic bytes
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

async function runTests() {
  console.log('====================================================');
  console.log('STARTING QA TESTS: VERIFICATION & COVER IMAGE UPLOAD');
  console.log('====================================================');

  const timestamp = Date.now();
  const testEmail = `test_provider_${timestamp}@vibemiles.local`;
  const adminUser = { id: 'admin-test-id', email: 'admin@vibemiles.com' };

  try {
    // ── TEST 1: Provider registration starts as UNVERIFIED ────────
    console.log('\n[TEST 1] Creating new provider user...');
    const registration = await createProviderUser({
      fullName: 'Test Operator',
      email: testEmail,
      phone: `9${String(Date.now()).slice(-9)}`,
      password: 'Password123!',
      businessName: `Test Travels ${timestamp}`,
      businessCategory: 'Tour Operator',
      city: 'Manali',
      state: 'Himachal Pradesh',
      pincode: '175131',
    });

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: registration.user.id },
      include: { documents: true },
    });

    console.log(`Provider created with initial status: ${providerProfile?.verificationStatus}`);
    if (providerProfile?.verificationStatus !== VerificationStatus.UNVERIFIED) {
      throw new Error(`Expected UNVERIFIED, got ${providerProfile?.verificationStatus}`);
    }
    console.log('✓ PASS: New provider starts strictly as UNVERIFIED.');

    // ── TEST 2: Attempting to create a package while UNVERIFIED fails ──
    console.log('\n[TEST 2] Verifying listing creation is blocked for unverified provider...');
    let blocked = false;
    try {
      await createPackage(providerProfile.id, {
        name: 'Manali Snow Adventure',
        description: 'Complete high-altitude tour of Solang valley and Rohtang.',
        basePrice: 5000,
        images: ['/uploads/packages/test.png'],
      });
    } catch (err: any) {
      blocked = true;
      console.log(`Successfully blocked: "${err.message}"`);
    }
    if (!blocked) {
      throw new Error('Unverified provider was able to create a package!');
    }
    console.log('✓ PASS: Package creation blocked when provider is not VERIFIED.');

    // ── TEST 3: Uploading first document sets status to PENDING ──────
    console.log('\n[TEST 3] Uploading Business Registration document...');
    const doc1 = await uploadProviderDocumentForUser({
      userId: registration.user.id,
      type: DocumentType.BUSINESS_REGISTRATION,
      buffer: VALID_PNG_BUFFER,
      originalFileName: 'gst_certificate.png',
      mimeType: 'image/png',
    });

    const updatedProfile1 = await prisma.providerProfile.findUnique({
      where: { id: providerProfile.id },
    });
    console.log(`After 1 doc, status is: ${updatedProfile1?.verificationStatus}`);
    if (updatedProfile1?.verificationStatus !== VerificationStatus.PENDING) {
      throw new Error(`Expected PENDING, got ${updatedProfile1?.verificationStatus}`);
    }
    console.log('✓ PASS: Uploading document sets provider status to PENDING (not auto-verified).');

    // ── TEST 4: Admin cannot approve provider with missing documents ─
    console.log('\n[TEST 4] Admin attempt to verify provider with missing documents...');
    let approvalBlocked = false;
    try {
      await reviewProviderVerificationInDb({
        adminUser,
        providerId: providerProfile.id,
        status: VerificationStatus.VERIFIED,
      });
    } catch (err: any) {
      approvalBlocked = true;
      console.log(`Admin approval correctly blocked: "${err.message}"`);
    }
    if (!approvalBlocked) {
      throw new Error('Admin was able to verify provider with missing documents!');
    }
    console.log('✓ PASS: Admin approval blocked if any of the 3 required documents are missing.');

    // ── TEST 5: Upload remaining 2 documents ──────────────────────
    console.log('\n[TEST 5] Uploading Government ID and Address Proof...');
    const doc2 = await uploadProviderDocumentForUser({
      userId: registration.user.id,
      type: DocumentType.GOVERNMENT_ID,
      buffer: VALID_PNG_BUFFER,
      originalFileName: 'aadhaar_card.png',
      mimeType: 'image/png',
    });

    const doc3 = await uploadProviderDocumentForUser({
      userId: registration.user.id,
      type: DocumentType.ADDRESS_PROOF,
      buffer: VALID_PNG_BUFFER,
      originalFileName: 'electricity_bill.png',
      mimeType: 'image/png',
    });

    const updatedProfile3 = await prisma.providerProfile.findUnique({
      where: { id: providerProfile.id },
    });
    console.log(`After all 3 docs uploaded, status is: ${updatedProfile3?.verificationStatus}`);
    if (updatedProfile3?.verificationStatus !== VerificationStatus.PENDING) {
      throw new Error(`Expected PENDING awaiting admin review, got ${updatedProfile3?.verificationStatus}`);
    }
    console.log('✓ PASS: All 3 docs uploaded, provider remains PENDING awaiting admin review.');

    // ── TEST 6: Admin gets provider list and details ──────────────
    console.log('\n[TEST 6] Admin listing providers with document stats...');
    const adminListing = await getAdminProviders({ search: testEmail });
    const foundProvider = adminListing.items.find((p) => p.id === providerProfile.id);
    if (!foundProvider) {
      throw new Error('Provider not found in admin listing');
    }
    console.log(`Admin listing returned: docsCount=${foundProvider.documentsCount}, pendingCount=${foundProvider.pendingDocsCount}`);
    if (foundProvider.documentsCount !== 3 || foundProvider.pendingDocsCount !== 3) {
      throw new Error(`Expected 3 docs and 3 pending, got ${foundProvider.documentsCount} and ${foundProvider.pendingDocsCount}`);
    }
    console.log('✓ PASS: Admin sees real document statistics in provider overview.');

    // ── TEST 7: Admin reviews documents one by one ────────────────
    console.log('\n[TEST 7] Admin reviewing documents individually...');
    // Approve doc 1
    await reviewProviderDocumentByAdmin({
      adminUserId: adminUser.id,
      adminEmail: adminUser.email,
      documentId: doc1.id,
      status: 'VERIFIED',
    });
    // Check provider status: should STILL be PENDING because docs 2 & 3 are not verified yet
    let midProfile = await prisma.providerProfile.findUnique({ where: { id: providerProfile.id } });
    console.log(`After 1 of 3 approved, provider status is: ${midProfile?.verificationStatus}`);
    if (midProfile?.verificationStatus !== VerificationStatus.PENDING) {
      throw new Error(`Expected PENDING, got ${midProfile?.verificationStatus}`);
    }

    // Approve doc 2
    await reviewProviderDocumentByAdmin({
      adminUserId: adminUser.id,
      adminEmail: adminUser.email,
      documentId: doc2.id,
      status: 'VERIFIED',
    });
    midProfile = await prisma.providerProfile.findUnique({ where: { id: providerProfile.id } });
    if (midProfile?.verificationStatus !== VerificationStatus.PENDING) {
      throw new Error(`Expected PENDING, got ${midProfile?.verificationStatus}`);
    }

    // Approve doc 3 (all 3 approved!)
    await reviewProviderDocumentByAdmin({
      adminUserId: adminUser.id,
      adminEmail: adminUser.email,
      documentId: doc3.id,
      status: 'VERIFIED',
    });
    const finalProfile = await prisma.providerProfile.findUnique({ where: { id: providerProfile.id } });
    console.log(`After all 3 approved by admin, provider status is: ${finalProfile?.verificationStatus}`);
    if (finalProfile?.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new Error(`Expected VERIFIED, got ${finalProfile?.verificationStatus}`);
    }
    console.log('✓ PASS: Provider only transitions to VERIFIED when all 3 documents are approved by admin.');

    // ── TEST 8: Package Creation with local /uploads/ Cover Image ──
    console.log('\n[TEST 8] Creating package now that provider is VERIFIED...');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'packages');
    await fs.mkdir(uploadDir, { recursive: true });
    const testImageFilename = `test_cover_${timestamp}.png`;
    await fs.writeFile(path.join(uploadDir, testImageFilename), VALID_PNG_BUFFER);

    const testImageUrl = `/uploads/packages/${testImageFilename}`;
    const newPackage = await createPackage(providerProfile.id, {
      name: `Manali Snow Explorer ${timestamp}`,
      description: 'Comprehensive guided adventure through scenic Himalayan passes.',
      basePrice: 12000,
      discountPercent: 10,
      images: [testImageUrl],
      destinationName: 'Manali',
      city: 'Manali',
      state: 'Himachal Pradesh',
    });

    const coverImage = typeof newPackage.images[0] === 'string' ? newPackage.images[0] : (newPackage.images[0] as any)?.url;
    console.log(`Package created: id=${newPackage.id}, coverImage=${coverImage}`);
    if (coverImage !== testImageUrl) {
      throw new Error(`Expected cover image ${testImageUrl}, got ${coverImage}`);
    }
    console.log('✓ PASS: Package successfully created with local uploaded cover image.');

    // ── TEST 9: Rejecting a document transitions provider to REJECTED ──
    console.log('\n[TEST 9] Testing document rejection behavior...');
    await reviewProviderDocumentByAdmin({
      adminUserId: adminUser.id,
      adminEmail: adminUser.email,
      documentId: doc3.id,
      status: 'REJECTED',
      reason: 'Address proof expired / address does not match business registration.',
    });

    const rejectedProfile = await prisma.providerProfile.findUnique({ where: { id: providerProfile.id } });
    console.log(`After doc rejection, provider status: ${rejectedProfile?.verificationStatus}`);
    if (rejectedProfile?.verificationStatus !== VerificationStatus.REJECTED) {
      throw new Error(`Expected REJECTED, got ${rejectedProfile?.verificationStatus}`);
    }
    console.log(`Rejection reason: "${rejectedProfile?.rejectionReason}"`);
    console.log('✓ PASS: Rejecting a document transitions provider to REJECTED with reason.');

    // Clean up test data
    console.log('\n[CLEANUP] Cleaning up test records...');
    await prisma.packageImage.deleteMany({ where: { packageId: newPackage.id } });
    await prisma.package.delete({ where: { id: newPackage.id } });
    await prisma.providerDocument.deleteMany({ where: { providerId: providerProfile.id } });
    await prisma.providerProfile.delete({ where: { id: providerProfile.id } });
    await prisma.user.delete({ where: { id: registration.user.id } });
    await fs.unlink(path.join(uploadDir, testImageFilename)).catch(() => null);
    console.log('✓ Clean up complete.');

    console.log('\n====================================================');
    console.log('ALL 9 TESTS PASSED PERFECTLY!');
    console.log('====================================================');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import type { SanitizedUser } from '@/server/auth/session';

export interface GeneratedTicket {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

/**
 * Formats a currency amount into standard INR notation safe for standard PDF fonts.
 */
function formatPdfCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return `INR ${rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a Date object into human-readable string.
 */
function formatPdfDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a Date object into human-readable timestamp with time.
 */
function formatPdfDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Generates an authoritative, vector PDF travel voucher & ticket for a booking.
 */
export async function generateBookingTicketPdf(
  bookingIdOrRef: string,
  authUser?: SanitizedUser | { id: string; role?: string; email?: string; customerProfile?: { id: string } | null } | null
): Promise<GeneratedTicket> {
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id: bookingIdOrRef }, { bookingRef: bookingIdOrRef }],
    },
    include: {
      package: {
        include: {
          destination: true,
        },
      },
      provider: true,
      customer: {
        include: {
          user: true,
        },
      },
      travelerDetails: true,
      optionalServices: true,
      payments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  // Authorization enforcement: Admin or the owning customer
  if (authUser && authUser.role !== 'admin') {
    const isOwner =
      booking.customerId === authUser.id ||
      booking.customer?.userId === authUser.id ||
      booking.customer?.user?.id === authUser.id ||
      (authUser.customerProfile && booking.customerId === authUser.customerProfile.id) ||
      (authUser.email && booking.customer?.user?.email === authUser.email) ||
      (authUser.email && booking.contactEmail === authUser.email);

    if (!isOwner) {
      throw new Error('Access denied: You are not authorized to view or download this travel ticket.');
    }
  }

  const latestPayment = booking.payments[0];
  const isConfirmed = booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'COMPLETED';
  const isCancelled = booking.bookingStatus === 'CANCELLED';

  // Generate QR Code verification buffer
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibemiles.com';
  const verificationUrl = `${appBaseUrl}/booking/confirmation/${booking.id}`;
  const qrPngBuffer = await QRCode.toBuffer(verificationUrl, {
    width: 140,
    margin: 1,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });

  // Create PDF Document (A4 size: 595.28 x 841.89 points)
  const doc = new PDFDocument({
    size: 'A4',
    margin: 36,
    info: {
      Title: `VibeMiles Ticket - ${booking.bookingRef}`,
      Author: 'VibeMiles Travel Marketplace',
      Subject: `E-Ticket and Travel Voucher for ${booking.package?.name || 'Tour Package'}`,
      Keywords: 'VibeMiles, Travel, Ticket, Voucher, Razorpay',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  // --- Background / Border Frame ---
  doc.rect(30, 30, 535, 782).strokeColor('#E2E8F0').lineWidth(1).stroke();

  // --- Top Header Bar ---
  doc.rect(36, 36, 523, 68).fill('#0F766E'); // Brand Teal

  // Brand Name & Tagline
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('VIBEMILES', 50, 48);
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#CCFBF1')
    .text('Curated Travel Marketplace — Official E-Ticket & Travel Voucher', 50, 74);

  // Top Header Right Info (Booking Ref)
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica').text('BOOKING REFERENCE', 350, 48, { align: 'right', width: 195 });
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#FEF08A').text(booking.bookingRef, 350, 62, { align: 'right', width: 195 });

  // --- Status Banner ---
  let statusBg = '#ECFDF5';
  let statusBorder = '#10B981';
  let statusText = '#065F46';
  let statusLabel = 'BOOKING CONFIRMED & SEATS RESERVED';

  if (isCancelled) {
    statusBg = '#FEF2F2';
    statusBorder = '#EF4444';
    statusText = '#991B1B';
    statusLabel = 'BOOKING CANCELLED — NOT VALID FOR TRAVEL';
  } else if (!isConfirmed) {
    statusBg = '#FFFBEB';
    statusBorder = '#F59E0B';
    statusText = '#92400E';
    statusLabel = 'RESERVATION PENDING PAYMENT CONFIRMATION';
  }

  doc.rect(36, 112, 523, 26).fillAndStroke(statusBg, statusBorder);
  doc.fillColor(statusText).fontSize(10).font('Helvetica-Bold').text(statusLabel, 50, 120);
  doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(`Issued: ${formatPdfDateTime(booking.createdAt)}`, 350, 120, { align: 'right', width: 195 });

  // --- Trip Overview Box (Left) & QR Code (Right) ---
  const tripBoxY = 146;
  doc.rect(36, tripBoxY, 415, 115).fillAndStroke('#F8FAFC', '#E2E8F0');

  doc.fillColor('#0F766E').fontSize(9).font('Helvetica-Bold').text('EXPERIENCE & HOST DETAILS', 48, tripBoxY + 10);

  doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text(booking.package?.name || 'Tour Package', 48, tripBoxY + 25, { width: 390 });

  const hostName = booking.provider?.businessName || 'Verified Travel Host';
  const destination = booking.package?.destination?.name || 'India';
  const durationDays = booking.package?.durationDays || 1;
  const durationNights = booking.package?.durationNights || durationDays - 1;

  doc.fillColor('#475569').fontSize(9).font('Helvetica').text(`Operated by: `, 48, tripBoxY + 52);
  doc.font('Helvetica-Bold').fillColor('#0F172A').text(hostName, 115, tripBoxY + 52);

  doc.font('Helvetica').fillColor('#475569').text(`Destination: `, 48, tripBoxY + 68);
  doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${destination} | Duration: ${durationDays}D / ${durationNights}N`, 115, tripBoxY + 68);

  doc.font('Helvetica').fillColor('#475569').text(`Departure Date: `, 48, tripBoxY + 84);
  doc.font('Helvetica-Bold').fillColor('#0F766E').text(formatPdfDate(booking.travelDate), 130, tripBoxY + 84);

  if (booking.pickup) {
    doc.font('Helvetica').fillColor('#475569').text(`Pickup Point: `, 48, tripBoxY + 100);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(booking.pickup, 115, tripBoxY + 100, { width: 310 });
  }

  // QR Code Box (Right)
  doc.rect(460, tripBoxY, 99, 115).fillAndStroke('#FFFFFF', '#CBD5E1');
  doc.image(qrPngBuffer, 469, tripBoxY + 8, { width: 81 });
  doc.fillColor('#64748B').fontSize(7).font('Helvetica').text('Scan to Verify', 460, tripBoxY + 98, { align: 'center', width: 99 });

  // --- Traveler Details Section ---
  const travelerY = 270;
  doc.fillColor('#0F766E').fontSize(10).font('Helvetica-Bold').text('PRIMARY BOOKER & TRAVELER ROSTER', 36, travelerY);

  // Primary Contact Info strip
  const contactName = booking.contactName || booking.customer?.fullName || 'Traveler';
  const contactEmail = booking.contactEmail || booking.customer?.user?.email || 'N/A';
  const contactPhone = booking.contactPhone || booking.customer?.user?.phone || 'N/A';

  doc.rect(36, travelerY + 15, 523, 24).fillAndStroke('#F1F5F9', '#CBD5E1');
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(
    `Booker: ${contactName}   |   Email: ${contactEmail}   |   Phone: ${contactPhone}   |   Party: ${booking.adults} Adults, ${booking.children} Children`,
    46,
    travelerY + 22
  );

  // Traveler Table Header
  const tableHeaderY = travelerY + 45;
  doc.rect(36, tableHeaderY, 523, 18).fill('#E2E8F0');
  doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold');
  doc.text('#', 44, tableHeaderY + 5);
  doc.text('TRAVELER NAME', 70, tableHeaderY + 5);
  doc.text('AGE', 280, tableHeaderY + 5);
  doc.text('GENDER', 340, tableHeaderY + 5);
  doc.text('GOVT ID / DOCUMENT', 420, tableHeaderY + 5);

  let currentY = tableHeaderY + 18;
  const travelers = booking.travelerDetails.length > 0
    ? booking.travelerDetails
    : [
        {
          firstName: contactName,
          lastName: '',
          age: 30,
          gender: 'Adult',
          idType: 'Govt Photo ID',
          idNumber: 'To verify at boarding',
        },
      ];

  travelers.slice(0, 6).forEach((t, idx) => {
    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(36, currentY, 523, 16).fillAndStroke(rowBg, '#F1F5F9');
    doc.fillColor('#1E293B').fontSize(8).font('Helvetica');
    doc.text(String(idx + 1), 44, currentY + 4);
    doc.text(`${t.firstName} ${t.lastName}`.trim(), 70, currentY + 4, { width: 200 });
    doc.text(String(t.age || '-'), 280, currentY + 4);
    doc.text(t.gender || '-', 340, currentY + 4);
    const idDisplay = t.idType && t.idNumber ? `${t.idType}: ${t.idNumber}` : 'ID Verification on arrival';
    doc.text(idDisplay, 420, currentY + 4, { width: 130 });
    currentY += 16;
  });

  // --- Payment & Fare Breakdown Section ---
  const fareY = currentY + 10;
  doc.fillColor('#0F766E').fontSize(10).font('Helvetica-Bold').text('PAYMENT RECORD & FARE BREAKDOWN', 36, fareY);

  // Left Box: Gateway Payment Snapshot
  const fareBoxesY = fareY + 15;
  doc.rect(36, fareBoxesY, 275, 110).fillAndStroke('#F8FAFC', '#E2E8F0');
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text('GATEWAY SETTLEMENT DETAILS', 46, fareBoxesY + 8);

  const paymentGateway = latestPayment?.paymentMethod ? latestPayment.paymentMethod.toUpperCase() : 'RAZORPAY';
  const gatewayTxn = latestPayment?.gatewayRef || latestPayment?.transactionId || 'PENDING';
  const gatewayOrder = latestPayment?.gatewayOrderId || 'N/A';
  const paidTime = latestPayment?.paidAt ? formatPdfDateTime(latestPayment.paidAt) : 'Pending Confirmation';

  doc.fillColor('#475569').fontSize(8).font('Helvetica');
  doc.text('Payment Gateway:', 46, fareBoxesY + 26);
  doc.font('Helvetica-Bold').fillColor('#0F172A').text(paymentGateway, 140, fareBoxesY + 26);

  doc.font('Helvetica').fillColor('#475569').text('Payment ID (Ref):', 46, fareBoxesY + 42);
  doc.font('Helvetica-Bold').fillColor('#0F172A').text(gatewayTxn, 140, fareBoxesY + 42, { width: 160 });

  doc.font('Helvetica').fillColor('#475569').text('Gateway Order ID:', 46, fareBoxesY + 58);
  doc.font('Helvetica-Bold').fillColor('#0F172A').text(gatewayOrder, 140, fareBoxesY + 58, { width: 160 });

  doc.font('Helvetica').fillColor('#475569').text('Paid At:', 46, fareBoxesY + 74);
  doc.font('Helvetica-Bold').fillColor('#0F172A').text(paidTime, 140, fareBoxesY + 74);

  doc.font('Helvetica').fillColor('#475569').text('Settlement Method:', 46, fareBoxesY + 90);
  doc.font('Helvetica-Bold').fillColor('#0F766E').text('Direct Merchant Escrow', 140, fareBoxesY + 90);

  // Right Box: Price Breakdown
  doc.rect(320, fareBoxesY, 239, 110).fillAndStroke('#F0FDFA', '#99F6E4');
  doc.fillColor('#0F766E').fontSize(8.5).font('Helvetica-Bold').text('AUTHORIZED PRICE RECEIPT', 330, fareBoxesY + 8);

  doc.fillColor('#334155').fontSize(8).font('Helvetica');
  doc.text('Base Tour Package:', 330, fareBoxesY + 26);
  doc.text(formatPdfCurrency(booking.baseAmount), 460, fareBoxesY + 26, { align: 'right', width: 90 });

  if (booking.optionalServicesAmount > 0) {
    doc.text('Addons & Services:', 330, fareBoxesY + 40);
    doc.text(`+${formatPdfCurrency(booking.optionalServicesAmount)}`, 460, fareBoxesY + 40, { align: 'right', width: 90 });
  }

  if (booking.discountAmount > 0) {
    doc.fillColor('#059669').text(`Discount (${booking.couponCode || 'Promo'}):`, 330, fareBoxesY + 54);
    doc.text(`-${formatPdfCurrency(booking.discountAmount)}`, 460, fareBoxesY + 54, { align: 'right', width: 90 });
  }

  doc.fillColor('#334155').text('Taxes (5% GST):', 330, fareBoxesY + 68);
  doc.text(`+${formatPdfCurrency(booking.taxAmount)}`, 460, fareBoxesY + 68, { align: 'right', width: 90 });

  doc.rect(328, fareBoxesY + 82, 223, 1).fill('#5EEAD4');

  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('Total Paid:', 330, fareBoxesY + 89);
  doc.fillColor('#0F766E').fontSize(11).text(formatPdfCurrency(booking.totalAmount), 440, fareBoxesY + 88, { align: 'right', width: 110 });

  // --- Important Instructions & Policies ---
  const rulesY = fareBoxesY + 122;
  doc.rect(36, rulesY, 523, 132).fillAndStroke('#FFFBEB', '#FDE68A');

  doc.fillColor('#92400E').fontSize(8.5).font('Helvetica-Bold').text('IMPORTANT TRAVEL GUIDELINES & CANCELLATION RULES', 46, rulesY + 8);

  doc.fillColor('#78350F').fontSize(7.5).font('Helvetica');
  const guidelines = [
    '1. Valid Photo ID Mandatory: Every adult traveler must present a valid government-issued photo ID (Aadhaar, Passport, Driving License, or Voter ID) at boarding.',
    '2. Reporting Time: Travelers must report at the designated pickup/assembly point at least 30 minutes before scheduled departure time.',
    '3. Cancellation Policy: Free full refund (100%) if cancelled >= 15 days before departure; 75% refund if cancelled 7-14 days before; 50% refund if cancelled 3-6 days before; non-refundable (< 3 days).',
    '4. Marketplace Assurance: Customer payments are securely held in central VibeMiles escrow and protected until service delivery.',
    '5. Host Direct Support: For instant assistance regarding pickup directions or tour itinerary, please contact your tour operator via the VibeMiles portal.',
    '6. 24x7 Emergency Contact: support@vibemiles.com  |  Customer Helpline: +91 (800) 842-3645  |  www.vibemiles.com',
  ];

  let gy = rulesY + 22;
  guidelines.forEach((g) => {
    doc.text(g, 46, gy, { width: 503 });
    gy += 17;
  });

  // --- Watermark (If Cancelled) ---
  if (isCancelled) {
    doc.save();
    doc.rotate(-35, { origin: [297, 420] });
    doc.fillColor('#EF4444').opacity(0.18).fontSize(60).font('Helvetica-Bold');
    doc.text('CANCELLED / VOID', 80, 400, { align: 'center', width: 440 });
    doc.restore();
  }

  // --- Footer ---
  const footerY = 788;
  doc.rect(36, footerY, 523, 1).fill('#E2E8F0');
  doc.fillColor('#94A3B8').fontSize(7).font('Helvetica').text(
    'This is a computer-generated official travel document issued by VibeMiles Travel Marketplace. No physical signature required.',
    36,
    footerY + 6,
    { align: 'center', width: 523 }
  );

  doc.end();

  // Await stream completion
  await new Promise<void>((resolve, reject) => {
    doc.on('end', () => resolve());
    doc.on('error', reject);
  });

  const buffer = Buffer.concat(chunks);
  const safeRef = booking.bookingRef.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    buffer,
    filename: `VibeMiles-Ticket-${safeRef}.pdf`,
    contentType: 'application/pdf',
  };
}

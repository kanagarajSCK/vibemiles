# VibeMiles — Razorpay Payments, Admin-Controlled Payouts & PDF Tickets Audit

**Date:** October 2026  
**Auditor / Roles:** Senior Payment Integration Engineer, Marketplace Architect, and Security Engineer  
**System:** VibeMiles Multi-Vendor Travel Marketplace  
**Architecture:** Next.js 16 (App Router), Prisma ORM, PostgreSQL (Supabase), Razorpay Gateway SDK, PDFKit  

---

## 1. Executive Summary

An end-to-end security, architectural, and financial audit was performed on the VibeMiles travel marketplace. The audit verified and completed the central payment collection pipeline, administrative payout approval ledger, and real customer vector PDF ticket generation.

### Business Model Compliance
- **Centralized Collection:** All customer payments settle exclusively to the VibeMiles registered business merchant bank account via Razorpay.
- **Strict Separation of Funds:** Customer checkout never initiates an automatic direct payment to a provider's bank account. Payment collection and provider payouts are strictly decoupled financial operations.
- **Provider Payable Ledger:** Provider earnings are tracked as amounts payable by VibeMiles in the `SettlementLedger` database table, calculated after deducting the platform commission (default 15.0%) and GST.
- **Admin Control Center:** Payouts to providers require explicit administrative review and state transition (`PENDING` ➔ `APPROVED` ➔ `PROCESSING` ➔ `SETTLED` with Bank UTR reference note).
- **Official Customer PDF Tickets:** Genuine vector PDF tickets with dynamic verification QR codes, traveler rosters, pricing snapshots, and gateway payment reference IDs are generated server-side.

---

## 2. Completed Audit Matrix

| Component | Status Before Audit | Status After Implementation | Notes |
| :--- | :--- | :--- | :--- |
| **Razorpay SDK Integration** | Present (`razorpay@2.9.8`) | ✅ **Active & Verified** | Configured in `src/server/payments/razorpay.ts` with sandbox test fallback. |
| **Server-side Order Creation** | Present (`createPaymentOrderForBooking`) | ✅ **Hardened** | Authoritative calculations in integer paise (`Math.round(totalAmount * 100)`). Browser-submitted amounts are rejected. |
| **Client Checkout UI** | Present (`PaymentActionCard.tsx`) | ✅ **Functional** | Standard Razorpay modal checkout with server order ID binding. |
| **Payment Signature Verification** | Present (`verifyRazorpayPaymentSignature`) | ✅ **Hardened** | Cryptographic HMAC SHA256 timing-safe comparison (`orderId + "\|" + paymentId`). |
| **Payment Capture State Verification** | ❌ Incomplete | ✅ **Completed** | Added `fetchRazorpayPayment()` to verify live gateway `captured === true`, exact paise amount, and currency `INR`. |
| **Webhook Signature Verification** | Present (`verifyRazorpayWebhookSignature`) | ✅ **Hardened** | Verifies HMAC SHA256 using `RAZORPAY_WEBHOOK_SECRET`. |
| **Webhook Idempotency** | ❌ Missing event deduplication | ✅ **Completed** | Event IDs tracked in `AuditLog` (`RAZORPAY_WEBHOOK_EVENT`). Duplicate retries return idempotent skip. |
| **Commission Ledger** | Present (`SettlementLedger`) | ✅ **Hardened** | Immutable commission rate and net provider payable snapshot recorded upon booking creation and payment. |
| **Admin Payout Workflow** | Partial modal | ✅ **Completed** | Full payout lifecycle implemented (`PENDING`, `APPROVED`, `PROCESSING`, `SETTLED`, `ON_HOLD`) with Bank UTR and audit trail. |
| **Provider Earnings Dashboard** | Basic metrics | ✅ **Completed** | Added settlement status badges, bank UTR display, and CSV statement download. |
| **Customer PDF E-Ticket** | ❌ Non-functional placeholder buttons | ✅ **Completed** | Server-side vector PDF generation with `pdfkit` and `qrcode`, QR verification, and IDOR protection. |

---

## 3. Financial Workflow & Payout Lifecycle

```
[ Customer Checkout ]
        │
        ▼
[ Server: Create Order ] ──► Razorpay Order (Paise)
        │
        ▼
[ Customer Pays via Razorpay ]
        │
        ├───────────────────────────────┐
        ▼                               ▼
[ Client Signature Verify ]     [ Webhook: payment.captured ]
        │                               │
        └───────────────┬───────────────┘
                        ▼
    [ Database Interactive Transaction ]
    1. Verify Gateway Captured Status & Paise Amount
    2. Payment Record ➔ PAID (gatewayRef = paymentId)
    3. Booking Record ➔ CONFIRMED (hold released)
    4. SettlementLedger ➔ PENDING (Gross, Commission, Net)
                        │
                        ▼ (Funds settle to VibeMiles Merchant Bank Account)
                =================================================
                ADMIN-CONTROLLED PROVIDER PAYOUT WORKFLOW
                =================================================
                        │
                        ▼
                [ Step 1: PENDING ]
                Tour completed; Host amount payable tracked in ledger.
                        │
                        ▼
                [ Step 2: APPROVED ]
                Admin reviews host documents, reviews, and approves payout.
                        │
                        ▼
                [ Step 3: PROCESSING ]
                Payout queued for banking batch / NEFT / RTGS transfer.
                        │
                        ▼
                [ Step 4: SETTLED ]
                Admin records official Bank UTR (e.g., UTR-98234710293).
                Permanent audit log entry written to PostgreSQL.
```

---

## 4. Key Files & Architecture

### 1. Payment Gateway Core
- [`src/server/payments/razorpay.ts`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/src/server/payments/razorpay.ts):
  - `createRazorpayOrder()`: Derives authoritative amount in integer paise.
  - `fetchRazorpayPayment()`: Queries live payment status and capture state from Razorpay API.
  - `verifyRazorpayPaymentSignature()`: Timing-safe HMAC SHA256 check.
  - `verifyRazorpayWebhookSignature()`: Timing-safe webhook HMAC SHA256 check.
  - `issueRazorpayRefund()`: Direct gateway refund integration.

### 2. Payment & Ledger Database Operations
- [`src/server/db/payments.ts`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/src/server/db/payments.ts):
  - `createPaymentOrderForBooking()`: Validates booking and creates gateway order.
  - `verifyPaymentAndConfirmBooking()`: Validates signature and gateway captured status; atomically confirms booking and sets up `SettlementLedger`.
  - `processRazorpayWebhookEvent()`: Idempotent webhook processor using `AuditLog` event deduplication.
  - `getAdminFinancialAnalytics()`: Aggregate gross volume, platform commission, payments summary (captured, pending, failed), and payout pipeline.
  - `getProviderFinancialSummary()`: Provider-specific revenue, pending clearance, approved payouts, and bank settlement ledger.

### 3. PDF Ticket Generator & API
- [`src/server/tickets/pdf-ticket.ts`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/src/server/tickets/pdf-ticket.ts):
  - Vector PDF generation using `pdfkit` (A4 standard format).
  - Verification QR code generated with `qrcode` linking to `/booking/confirmation/[bookingId]`.
  - Full traveler roster, trip operator, package details, payment gateway reference ID, price breakdown, and boarding instructions.
  - Dynamic watermark: Displays prominent `CANCELLED / VOID` watermark if booking has been cancelled.
  - IDOR authorization: Only the owning customer or platform admin can generate and view tickets.
- [`src/app/api/bookings/[id]/ticket/route.ts`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/src/app/api/bookings/[id]/ticket/route.ts):
  - Streaming endpoint serving `application/pdf` with `Content-Disposition: inline; filename="VibeMiles-Ticket-[ref].pdf"`.

### 4. Admin & Provider User Interfaces
- [`src/app/(admin)/admin/payments/page.tsx`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/src/app/(admin)/admin/payments/page.tsx):
  - Overview cards: Net platform commission, gross booking volume, GST collected.
  - Customer Payments breakdown: Captured & Paid, Pending Checkout, Failed Payments, Total Refunds.
  - Provider Payouts breakdown: Pending Review, Approved for Payout, Processing in Bank, Settled to Bank.
  - Recent Settlement Ledger table with Bank UTR reference notes and links to settlement manager.
- [`src/app/(admin)/admin/settlements/page.tsx`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/src/app/(admin)/admin/settlements/page.tsx):
  - Reconcile modal with status transitions: `APPROVED`, `PROCESSING`, `SETTLED`, `PENDING`, `ON_HOLD`, `FAILED`.
  - Bank UTR / NEFT reference input with audit log generation.
  - Filter tabs for all payout lifecycle stages.
- [`src/app/(provider)/provider/earnings/page.tsx`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/src/app/(provider)/provider/earnings/page.tsx):
  - Real-time gross bookings, platform fee deduction, pending settlements, and settled amounts.
  - Payout status badges (`APPROVED (PENDING TRANSFER)`, `SETTLED`, `PENDING`).
  - Bank UTR and settled date display.
  - One-click CSV statement export for host accounting.
- [`src/app/(customer)/account/bookings/page.tsx`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/src/app/(customer)/account/bookings/page.tsx):
  - Download Ticket (PDF) button directly accessible from customer bookings list.
- [`src/app/(public)/booking/confirmation/[bookingId]/page.tsx`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/src/app/(public)/booking/confirmation/[bookingId]/page.tsx):
  - "Download PDF" and "Print Voucher" buttons connected directly to the streaming ticket API.

---

## 5. Verification Test Suite Results

An automated end-to-end verification script ([`scripts/verify-payments-and-tickets.ts`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/scripts/verify-payments-and-tickets.ts)) was executed against the database and payment pipeline:

```
====================================================
  VibeMiles Payments, Payouts & PDF Verification   
====================================================

--- Test 1: Cancellation Refund Calculation ---
✅ [PASS] 15+ days: 100% refund
✅ [PASS] 7-14 days: 75% refund
✅ [PASS] 3-6 days: 50% refund
✅ [PASS] < 3 days: 0% non-refundable

--- Test 2: Cryptographic Signature Verification ---
✅ [PASS] Valid payment signature passes
✅ [PASS] Tampered signature rejected

--- Test 3: Webhook Verification & Idempotency ---
✅ [PASS] Webhook HMAC SHA256 signature verification passes
✅ [PASS] First webhook run records and executes cleanly
✅ [PASS] Duplicate webhook event recognized and skipped idempotently

--- Test 4: PDF Ticket Generation ---
✅ [PASS] PDF generated as a valid binary Buffer
✅ [PASS] PDF size is genuine (6288 bytes)
✅ [PASS] Filename formatted properly: VibeMiles-Ticket-TM849201.pdf
✅ [PASS] Content-Type is application/pdf
✅ [PASS] PDF contains valid %PDF- magic bytes header
✅ [PASS] Unauthorized user is forbidden from generating another customer ticket

--- Test 5: Admin Financial Analytics & Metrics ---
✅ [PASS] grossVolume is a valid number
✅ [PASS] totalCommissionEarned is a valid number
✅ [PASS] totalProviderPayables is a valid number
✅ [PASS] Platform commission rate defaults to 15%
✅ [PASS] paymentsSummary breakdown populated
✅ [PASS] payoutsSummary breakdown populated

--- Test 6: Provider Financial Summary ---
✅ [PASS] Provider grossRevenue is number
✅ [PASS] Provider netPayable is number
✅ [PASS] Provider settlements list returned

====================================================
  ALL 24/24 TESTS PASSED SUCCESSFULLY! 
====================================================
```

---

## 6. Environment Variables Reference

Ensure the following variables are defined in `.env`:

```bash
# PostgreSQL Connection
DATABASE_URL="postgresql://postgres:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@host:5432/postgres"

# Authentication & Base URL
AUTH_SECRET="your-32-byte-secret"
NEXT_PUBLIC_APP_URL="https://vibemiles.com"

# Razorpay Merchant Credentials
# (Customer payments settle to the VibeMiles bank account registered with these credentials)
RAZORPAY_KEY_ID="rzp_live_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_your_key_id"

# Webhook Secret (Razorpay Dashboard > Settings > Webhooks)
# Subscribed Events: payment.captured, payment.failed, order.paid
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# Marketplace Platform Take-Rate
PLATFORM_COMMISSION_PERCENT="15.0"
```

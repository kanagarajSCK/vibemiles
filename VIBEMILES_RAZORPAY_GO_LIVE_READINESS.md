# VibeMiles — Razorpay Go-Live Readiness Review

**Audit Date:** October 2026  
**Auditor Roles:** Senior Payment Integration Engineer, Marketplace Architect, and Security Engineer  
**System:** VibeMiles Travel Marketplace  
**Readiness Verdict:** ⚠️ **READY FOR TEST-MODE CREDENTIAL ONBOARDING — NOT READY FOR PRODUCTION**  

---

## 1. Executive Summary & Readiness Verdict

The VibeMiles payment integration, provider settlement ledger, and PDF ticket generation codebase have been thoroughly audited and tested. 

The software architecture is **fully implemented, cryptographically sound, and mathematically verified**. However, **neither Razorpay Test Mode nor Live credentials are currently configured in the environment (`.env`)**. The application is currently executing in its safe, local developer sandbox fallback mode.

Before this marketplace can process actual payments or enter production:
1. Razorpay Test Mode API keys (`rzp_test_...`) and webhook secrets must be provided in `.env`.
2. An end-to-end transaction must be executed through the live Razorpay Checkout modal using standard test UPI / card credentials.
3. Razorpay merchant KYC and business bank account verification must be completed before activating live credentials (`rzp_live_...`).

---

## 2. Readiness Evaluation Matrix

| # | Check / Requirement | Status | Concrete Evidence | Findings & Technical Details |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Environment Secrets Inspection** | ✅ **PASS** | `scripts/check-env.cjs` inspected without exposing secret values. | `.env` was safely inspected. `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` are configured. No payment keys are exposed client-side. |
| **2** | **Razorpay Credentials Configuration** | ⚠️ **NOT CONFIGURED** | `.env` has no `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET`. `isRazorpayConfigured()` evaluates to `false`. | Neither Test Mode (`rzp_test_`) nor Live Mode (`rzp_live_`) keys are present in `.env`. Gateway API calls fall back safely to local sandbox mode. |
| **3** | **Authoritative Server-side Order Creation** | ✅ **PASS** | `createPaymentOrderForBooking()` in `src/server/db/payments.ts`. | Orders are created on the server strictly using persisted booking totals converted to integer minor units (`Math.round(totalAmount * 100)` paise). Browser-submitted amounts are rejected. |
| **4** | **Cryptographic Signature Verification** | ✅ **PASS** | `verifyRazorpayPaymentSignature()` in `src/server/payments/razorpay.ts`. | Timing-safe HMAC SHA256 comparison (`crypto.timingSafeEqual`) of `order_id + "\|" + payment_id` against `RAZORPAY_KEY_SECRET`. Tested with valid and tampered signatures. |
| **5** | **Live Captured-Payment Status Verification** | ✅ **PASS** | `fetchRazorpayPayment()` in `src/server/payments/razorpay.ts` called in `verifyPaymentAndConfirmBooking()`. | When Razorpay credentials are configured, the server queries Razorpay API to confirm `status === 'captured'`, `captured === true`, exact amount in paise, and currency `INR`. |
| **6** | **Webhook Signature Verification & Idempotency** | ✅ **PASS** | `processRazorpayWebhookEvent()` in `src/server/db/payments.ts`. | Validates `x-razorpay-signature` via HMAC SHA256 using `RAZORPAY_WEBHOOK_SECRET`. Idempotency enforced via `AuditLog` table lookup on `webhookEventId`. Tested and verified. |
| **7** | **Duplicate Booking / Ledger Entry Prevention** | ✅ **PASS** | `Prisma.SettlementLedger` unique constraint on `bookingId` (`schema.prisma` L534). | `SettlementLedger` enforces `@unique` on `bookingId` using `upsert`. Double verification returns existing confirmed booking without duplicating ledger rows or transactions. |
| **8** | **Central Merchant Account Collection (Zero Direct Transfers)** | ✅ **PASS** | `createRazorpayOrder()` in `src/server/payments/razorpay.ts`. | Order creation contains NO `transfers` array, NO Route account IDs, and NO split payment instructions. 100% of customer funds settle to the VibeMiles merchant bank account. |
| **9** | **Manual Bank Transfer vs. Gateway Transfer Distinction** | ✅ **PASS** | `updateSettlementStatusInDb()` in `src/server/db/admin.ts`. | **Provider payouts are strictly manual offline bank transfers (NEFT/RTGS/IMPS)** recorded by Admin with an official Bank UTR number. The codebase has NO automated RazorpayX banking transfer API. |
| **10** | **Customer Vector PDF Ticket Generation** | ✅ **PASS** | `generateBookingTicketPdf()` in `src/server/tickets/pdf-ticket.ts`. | Server-generated vector PDF with `pdfkit` (6,288 bytes, `%PDF-` header), dynamic QR verification code, traveler roster, gateway reference ID, and `CANCELLED` watermark. |
| **11** | **PDF Ticket IDOR & Security Protection** | ✅ **PASS** | Tested via `scripts/test-pdf-endpoint.ts`. | Admin and owning customer have full access. Unauthorized customers / strangers are rejected with 403 `Access denied`. Non-existent bookings return 404. |
| **12** | **Commission & Financial Calculations Consistency** | ✅ **PASS** | Verified across `bookings.ts`, `payments.ts`, `SettlementLedger`, Admin and Provider dashboards. | Subtotal = Base + Addons - Discount. GST = 5% of Subtotal. Platform Commission = 15% of Subtotal. Provider Net = Subtotal - Commission. Total = Subtotal + GST. Consistent everywhere. |
| **13** | **Repeatable Automated Test Suite** | ✅ **PASS** | `scripts/verify-payments-and-tickets.ts` passed 24/24 tests across two independent executions. | All 24 unit and database integration tests passed. Note: Payment tests currently use cryptographic sandbox simulation because gateway API keys are NOT CONFIGURED. |

---

## 3. Deep-Dive Findings & Technical Analysis

### 3.1 Actual Environment Configuration
- In the active `.env` file, the database and authentication secrets are properly set:
  - `DATABASE_URL`: Configured (Supabase PostgreSQL pooler).
  - `DIRECT_URL`: Configured (Supabase direct connection).
  - `AUTH_SECRET`: Configured (64-character secret).
- However, payment gateway keys are **absent**:
  - `RAZORPAY_KEY_ID`: Missing.
  - `RAZORPAY_KEY_SECRET`: Missing.
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Missing.
  - `RAZORPAY_WEBHOOK_SECRET`: Missing.
  - `PLATFORM_COMMISSION_PERCENT`: Not set in `.env` (falls back to default `15.0%`).
- Because keys are absent, `isRazorpayConfigured()` evaluates to `false`, activating the developer sandbox fallback.

### 3.2 Customer Payment Collection & Central Escrow
- **Merchant Account:** Customer payments are addressed solely to VibeMiles.
- **Checkout Behavior:** Razorpay Checkout modal receives `order_id` generated by the VibeMiles server.
- **No Direct Transfers:** The `orders.create` payload has no `transfers` instruction. Funds enter VibeMiles's gateway balance and settle to VibeMiles's linked bank account according to the Razorpay settlement cycle (T+2 days).
- **Accounting Record:** Upon payment confirmation, a `SettlementLedger` row is created with status `PENDING`, holding the provider's net earnings until admin approval.

### 3.3 Provider Payout Mechanism: Manual Bank Transfers with UTR
- **CRITICAL DISTINCTION:** Provider payouts are **NOT executed via Razorpay Route or RazorpayX API**.
- When an admin navigates to `/admin/settlements` and reconciles a payout:
  1. The admin reviews the completed booking, provider bank account details (`bankAccountNumber`, `bankIfsc`, `bankAccountHolder`), and the net payable amount.
  2. The admin transfers the funds manually via their corporate bank portal (e.g., HDFC/ICICI Corporate Net Banking via NEFT/RTGS/IMPS).
  3. The admin returns to VibeMiles, marks the payout as `SETTLED`, and inputs the official **Bank UTR Number** (e.g., `UTR-2026102798412`).
  4. The system writes an immutable audit record in `AuditLog` capturing the timestamp, admin ID, UTR note, and amount disbursed.
- This model is intentional and safer for an early-stage marketplace, as it completely prevents accidental or unauthorized automated bank debits.

### 3.4 Idempotency & Duplicate Prevention
- **Payment Verification:** If the user or network re-submits the verify endpoint with an already confirmed payment reference (`gatewayRef === paymentId`), the interactive transaction detects `bookingStatus === 'CONFIRMED'` and returns the existing domain booking without updating counts or balances.
- **Settlement Ledger:** Enforced by PostgreSQL `@unique` constraint on `SettlementLedger.bookingId`.
- **Webhooks:** Webhook processing checks `AuditLog` for `action = 'RAZORPAY_WEBHOOK_EVENT'` and `targetId = webhookEventId`. If present, the handler immediately exits with `idempotent skip`.

### 3.5 PDF Ticket Verification Results
The test script [`scripts/test-pdf-endpoint.ts`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/scripts/test-pdf-endpoint.ts) was executed against a live database booking (`ID=cmv0smqax002buz70a3bdc1x4`, `Ref=TM849201`):
1. **Admin User:** Generated ticket `VibeMiles-Ticket-TM849201.pdf` (6,288 bytes, valid `%PDF-` header).
2. **Owning Customer:** Generated identical ticket successfully.
3. **Unauthorized Stranger:** Threw `Access denied: You are not authorized to view or download this travel ticket.` (403 Forbidden).
4. **Invalid Booking ID:** Threw `Booking not found.` (404 Not Found).
5. **UI Integration:** The "Download PDF" and "Print Voucher" buttons on `/booking/confirmation/[bookingId]` and `/account/bookings` stream directly from `/api/bookings/[id]/ticket`.

---

## 4. Test Suite Nature: Repeatable Sandbox vs. Live Gateway

The test suite [`scripts/verify-payments-and-tickets.ts`](file:///c:/Users/kanag/OneDrive/Documents/vibemile-main/vibemile-main/scripts/verify-payments-and-tickets.ts) contains **24 automated tests** that passed 100% across two consecutive executions:
- **Refund Policy Tier Math:** 4 tests (100%, 75%, 50%, 0%).
- **Cryptographic Signature Verification:** 2 tests (Valid HMAC SHA256 passes; tampered signature fails).
- **Webhook Processing & Idempotency:** 3 tests (HMAC verification, first write to `AuditLog`, duplicate skip).
- **PDF Generation & Access Control:** 6 tests (binary validation, magic bytes, length, IDOR rejection).
- **Admin Analytics:** 6 tests (queries live PostgreSQL database tables for volume, commission, payables, refunds, breakdown counts).
- **Provider Financial Summary:** 3 tests (queries live PostgreSQL database for provider revenue and settlement rows).

**Important Note on Test Nature:**
These tests use **synthetic payloads and local cryptographic hashing** for gateway verification because Razorpay credentials are not yet configured in `.env`. They confirm that the server-side logic, database constraints, signature verification, and PDF streaming work properly. They do NOT test an actual live network socket call to `api.razorpay.com`.

---

## 5. Remaining Manual Setup Steps for Go-Live

To transition this payment system from developer sandbox mode to live payment processing:

### Step 1: Obtain Razorpay Test Mode Credentials
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Toggle the switch in the top navigation bar from **Live** to **Test Mode**.
3. Navigate to **Account & Settings** ➔ **API Keys** ➔ **Generate Test Key**.
4. Copy the `Key ID` (`rzp_test_...`) and `Key Secret`.

### Step 2: Configure Environment Variables
Add the following keys to your local `.env` and your production deployment hosting environment (e.g., Vercel / Railway):

```bash
# Razorpay Test Mode Credentials
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"

# Razorpay Webhook Secret (Step 4 below)
RAZORPAY_WEBHOOK_SECRET="your_chosen_webhook_secret_string"

# Platform Take-Rate
PLATFORM_COMMISSION_PERCENT="15.0"
```

### Step 3: Test Real Checkout in Razorpay Test Mode
1. Start the application: `npm run dev`.
2. Browse to any approved travel package and click **Book Now**.
3. Select travel dates, add traveler details, and click **Pay & Confirm Reservation**.
4. The genuine Razorpay Checkout modal will open.
5. In the Razorpay modal, select **UPI** (enter `success@razorpay` to simulate a successful payment, or `failure@razorpay` to simulate a failed payment), or select **Card** and use Razorpay standard test cards.
6. Verify that upon payment, the browser redirects to `/booking/confirmation/[bookingId]`, the status shows `CONFIRMED`, and the "Download PDF" button generates your genuine travel ticket with QR code.

### Step 4: Configure Razorpay Webhook Endpoint
1. In the Razorpay Dashboard, navigate to **Account & Settings** ➔ **Webhooks** ➔ **Add New Webhook**.
2. **Webhook URL:** `https://your-domain.com/api/webhooks/razorpay` (or your Ngrok tunnel URL during local testing).
3. **Secret:** Set to the exact value of `RAZORPAY_WEBHOOK_SECRET` in `.env`.
4. **Active Events:**
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Click **Create Webhook**.

### Step 5: Merchant KYC & Production Activation
1. Complete Razorpay Business KYC: Submit Certificate of Incorporation, Business PAN, GSTIN, and linked Current Bank Account details.
2. Once Razorpay approves the business account, switch the dashboard toggle to **Live Mode**.
3. Generate **Live API Keys** (`rzp_live_...`).
4. Replace `rzp_test_...` with `rzp_live_...` in production environment settings.
5. Create a Live Webhook in the Razorpay Dashboard pointing to your production URL with a strong random secret.
6. Perform a live ₹1 or ₹10 canary transaction to confirm central settlement into the VibeMiles business bank account.
7. Perform an admin payout reconciliation on the canary transaction at `/admin/settlements` to verify end-to-end accounting.

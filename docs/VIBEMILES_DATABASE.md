# VibeMiles Database Documentation

## 1. Database Technology

- **Database Engine**: PostgreSQL 15+ (Relational Database Management System)
- **Object-Relational Mapping (ORM)**: Prisma ORM v6
- **Language**: TypeScript
- **Target Architecture**: Normalized, multi-tenant relational marketplace supporting Travellers (Customers), Operators (Providers), and Platform Administrators.

---

## 2. Prisma Setup

- **Schema Location**: `prisma/schema.prisma`
- **Seed Script**: `prisma/seed.ts` (executed via `tsx`)
- **Centralized Client**: `src/lib/prisma.ts`
- **Singleton Pattern**: Follows the Next.js global singleton convention on `globalThis` to prevent connection exhaustion during development hot reloading.

---

## 3. Environment Variables

All database connection credentials are fully externalized via environment variables.

| Variable Name | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | Standard PostgreSQL connection URI | `postgresql://USER:PASSWORD@HOST:5432/vibemiles?schema=public` |
| `NODE_ENV` | Optional | Runtime environment (`development`, `production`, `test`) | `development` |

> [!CAUTION]
> Never commit `.env` or production credentials to source control. Use `.env.example` as a template.

---

## 4. Entity List

The database schema models all domain entities defined in the VibeMiles prototype:

| Model | Table Name | Purpose | Key Attributes |
| :--- | :--- | :--- | :--- |
| `User` | `User` | Central authentication identity for all roles | `id`, `email`, `phone`, `passwordHash`, `role`, `status` |
| `CustomerProfile` | `CustomerProfile` | Profile and preferences for travellers | `userId`, `fullName`, `avatar`, `dob`, `city`, `rewardPoints`, `isVerified` |
| `ProviderProfile` | `ProviderProfile` | Business profile for travel operators | `userId`, `businessName`, `businessCategory`, `address`, `bankDetails`, `verificationStatus`, `rating` |
| `Category` | `Category` | Travel service categories | `slug`, `name`, `icon`, `description`, `isActive` |
| `Destination` | `Destination` | Verified destinations & tourist hubs | `slug`, `name`, `state`, `heroImage`, `bestTimeToVisit`, `isPopular`, `isTrending` |
| `Package` | `Package` | Travel listings / packages | `slug`, `providerId`, `categoryId`, `destinationId`, `name`, `pricing`, `duration`, `status` |
| `PackageImage` | `PackageImage` | Media gallery metadata per package | `packageId`, `url`, `altText`, `sortOrder`, `isCover` |
| `ItineraryDay` | `ItineraryDay` | Day-by-day travel breakdown | `packageId`, `day`, `title`, `description`, `activities`, `meals`, `accommodation` |
| `PackageInclusion` | `PackageInclusion` | Explicit inclusions & exclusions | `packageId`, `text`, `isIncluded` |
| `PackageAvailability` | `PackageAvailability` | Departure slots, capacity & pricing | `packageId`, `date`, `price`, `capacity`, `bookedCount`, `isAvailable` |
| `Booking` | `Booking` | Reservations placed by customers | `bookingRef`, `packageId`, `customerId`, `providerId`, `travelDate`, `amounts`, `bookingStatus` |
| `TravelerDetail` | `TravelerDetail` | Passenger manifests per booking | `bookingId`, `firstName`, `lastName`, `age`, `gender`, `idType`, `idNumber` |
| `BookingAddon` | `BookingAddon` | Optional selected add-on services | `bookingId`, `name`, `description`, `price` |
| `Payment` | `Payment` | Payment transactions & audit trail | `bookingId`, `transactionId`, `paymentMethod`, `amount`, `status`, `paidAt` |
| `Review` | `Review` | Verified customer reviews & ratings | `packageId`, `customerId`, `bookingId`, `rating`, `title`, `comment`, `providerReply` |
| `Coupon` | `Coupon` | Promotional discount vouchers | `code`, `discountType`, `discountValue`, `minBookingAmount`, `validFrom`, `validUntil`, `isActive` |

---

## 5. Relationships & Domain Architecture

```
User (1)
 ├── (1:1) CustomerProfile (1)
 │          ├── (1:N) Booking (N)
 │          │          ├── (1:N) TravelerDetail (N)
 │          │          ├── (1:N) BookingAddon (N)
 │          │          └── (1:N) Payment (N)
 │          └── (1:N) Review (N)
 │
 └── (1:1) ProviderProfile (1)
            ├── (1:N) Package (N)
            │          ├── (1:N) PackageImage (N)
            │          ├── (1:N) ItineraryDay (N)
            │          ├── (1:N) PackageInclusion (N)
            │          ├── (1:N) PackageAvailability (N)
            │          ├── (1:N) Booking (N)
            │          └── (1:N) Review (N)
            └── (1:N) Booking (N)

Category (1) ──── (1:N) ──── Package (N)
Destination (1) ─ (1:N) ──── Package (N)
```

### Key Foreign Key Constraints & Cascades:
- Deleting a `User` cascades to delete their `CustomerProfile` or `ProviderProfile`.
- Deleting a `ProviderProfile` cascades to delete all their owned `Package` listings.
- Deleting a `Package` cascades to delete its `PackageImage`, `ItineraryDay`, `PackageInclusion`, and `PackageAvailability` records.
- Deleting a `Booking` cascades to delete its `TravelerDetail`, `BookingAddon`, and `Payment` audit records.
- `Category` and `Destination` deletion is restricted if associated active `Package` records exist.

---

## 6. Important Enums

- **`UserRole`**: `CUSTOMER`, `PROVIDER`, `ADMIN`
- **`UserStatus`**: `ACTIVE`, `INACTIVE`, `SUSPENDED`
- **`VerificationStatus`**: `UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`
- **`ApprovalStatus`**: `PENDING`, `APPROVED`, `REJECTED`
- **`ListingStatus`**: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `PUBLISHED`, `ARCHIVED`
- **`BookingStatus`**: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `REJECTED`
- **`PaymentStatus`**: `PENDING`, `PAID`, `REFUNDED`, `PARTIALLY_REFUNDED`, `FAILED`
- **`ReviewStatus`**: `PENDING`, `APPROVED`, `REJECTED`
- **`DiscountType`**: `PERCENTAGE`, `FIXED`

---

## 7. Migration Commands

```bash
# Validate Prisma schema syntax and relations
npx prisma validate

# Generate Prisma Client code
npx prisma generate

# Create and apply a new migration against PostgreSQL
npx prisma migrate dev --name init_vibemiles_schema

# Apply existing migrations in CI/CD or staging/production
npx prisma migrate deploy
```

---

## 8. Seed Commands

```bash
# Execute the seed script
npx prisma db seed

# Or run via npm script
npm run db:seed
```

The seed script (`prisma/seed.ts`):
1. Creates standard marketplace categories (Tours, Stays, Villas, Adventures, Food, etc.).
2. Creates an administrator identity (`admin@vibemiles.com`).
3. Seeds verified operators (e.g., Himalayan Escapes, Backwater Luxury Cruises, Rajasthan Haveli).
4. Seeds customer profiles (e.g., Rahul Verma, Ananya Sharma).
5. Seeds popular travel destinations across India (Manali, Kerala, Goa, Hampi, Coorg, Ladakh).
6. Seeds full tour packages with day-by-day itineraries, inclusions, exclusions, and departure availability dates.
7. Seeds sample booking records, traveler details, and corresponding payment ledger entries.
8. Seeds verified reviews and promotional discount coupons.
9. All operations use `upsert` to guarantee idempotency across multiple runs.

---

## 9. How the Marketplace Data Model Works

1. **User Identity vs Role Profiles**:
   - `User` maintains the primary authentication identity (email, phone, passwordHash, role).
   - Profile-specific details reside in `CustomerProfile` or `ProviderProfile`. This avoids sparse nullable columns and maintains high data normalization.
2. **Provider Moderation Workflow**:
   - When a provider registers, their `verificationStatus` is `PENDING`. Admins review business documents (`panNumber`, `gstNumber`, bank details) before transitioning them to `VERIFIED`.
3. **Listing Lifecycle**:
   - Listings are owned by a `ProviderProfile` and categorized under a `Category` and `Destination`.
   - Listings transition through `DRAFT` → `PENDING_REVIEW` → `APPROVED` → `PUBLISHED`.
   - Public marketplace queries only surface listings where `status = PUBLISHED`, `isActive = true`, and the provider is `isActive = true`.
4. **Booking Lifecycle & Isolation**:
   - When a customer reserves a package, a `Booking` is created linking `customer`, `provider`, and `package`.
   - Passenger details are locked into `TravelerDetail` records.
   - Pricing components (base price, taxes, discounts, add-ons) are recorded as point-in-time financial values to ensure historical integrity even if package prices change later.

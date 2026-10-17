import { z } from 'zod';

export const loginSchema = z.object({
  emailOrPhone: z.string().min(3, 'Email or Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'provider', 'admin']),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid 10-digit mobile number is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
    role: z.enum(['customer', 'provider']),
    businessName: z.string().optional(),
    businessCategory: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const travelerDetailSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  age: z.number().min(1, 'Age is required').max(120),
  gender: z.enum(['male', 'female', 'other']),
  idType: z.enum(['aadhaar', 'passport', 'driving_license']).optional(),
  idNumber: z.string().optional(),
});

export const bookingFormSchema = z.object({
  travelDate: z.string().min(1, 'Travel date is required'),
  adults: z.number().min(1, 'At least 1 adult traveler is required'),
  children: z.number().min(0),
  travelerDetails: z.array(travelerDetailSchema),
  pickup: z.string().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.string().min(1, 'Please select a payment method'),
});

export const providerOnboardingSchema = z.object({
  businessName: z.string().min(2, 'Business Name is required'),
  ownerName: z.string().min(2, 'Owner Name is required'),
  businessCategory: z.string().min(1, 'Business Category is required'),
  description: z.string().min(10, 'Provide a short business description'),
  addressLine1: z.string().min(3, 'Address line 1 is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  panNumber: z.string().min(10, 'Valid 10-character PAN is required'),
  gstNumber: z.string().optional(),
});

export const packageWizardSchema = z.object({
  name: z.string().min(5, 'Package name must be at least 5 characters'),
  category: z.string().min(1, 'Category is required'),
  destinationName: z.string().min(2, 'Destination is required'),
  durationDays: z.number().min(1, 'Duration must be at least 1 day'),
  durationNights: z.number().min(0),
  basePrice: z.number().min(100, 'Price must be at least ₹100'),
  discountPercent: z.number().min(0).max(90),
  description: z.string().min(20, 'Provide a detailed description'),
});

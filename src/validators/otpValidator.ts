// src/validators/otpValidator.ts
import { z } from 'zod';

export const requestOtpSchema = z.object({
    email: z.string().email("A valid email is required to send OTP."),
    userId: z.string().uuid("Valid user ID is required if OTP is for an existing user.").optional(), // Optional
});

export const verifyOtpSchema = z.object({
    email: z.string().email("A valid email is required."),
    otp: z.string().length(6, "OTP must be a 6-digit code."), // Assuming 6-digit OTP
});
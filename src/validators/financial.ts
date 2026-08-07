import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  amount: z.number().int().positive('مبلغ باید عدد صحیح و مثبت باشد'),
  callbackUrl: z.string().url(),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
});

export const reportQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

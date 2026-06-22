import { z } from 'zod';

// Farmer validation
export const FarmerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ?? ''))
    .refine(
      (value) => value === '' || /^(?:\+254|0)[17][0-9]{8}$/.test(value),
      {
        message: 'Invalid Kenyan phone number format',
      }
    ),
  evening_delivery_enabled: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export type FarmerFormData = z.infer<typeof FarmerSchema>;

// Milk quantity validation - accept any positive decimal value
const validateMilkQuantity = (value: number) => {
  return typeof value === 'number' && !Number.isNaN(value) && value > 0;
};

export const MilkDeliverySchema = z.object({
  farmer_id: z.string().uuid('Invalid farmer ID'),
  litres: z
    .number()
    .positive('Litres must be greater than 0')
    .refine(validateMilkQuantity, {
      message: 'Enter a valid positive number for litres',
    }),
  delivery_type: z.enum(['morning', 'evening']),
  date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'Invalid date format'),
});

export type MilkDeliveryFormData = z.infer<typeof MilkDeliverySchema>;

// Advance/deduction validation
export const AdvanceSchema = z.object({
  farmer_id: z.string().uuid('Invalid farmer ID'),
  amount_kes: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
  entry_type: z.enum(['advance_cash', 'advance_goods']),
});

export type AdvanceFormData = z.infer<typeof AdvanceSchema>;

// Payment validation
export const PaymentSchema = z.object({
  farmer_id: z.string().uuid('Invalid farmer ID'),
  amount: z.number().positive('Amount must be greater than 0'),
  method: z.enum(['cash', 'mpesa']),
  notes: z.string().optional(),
  date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'Invalid date format'),
});

export type PaymentFormData = z.infer<typeof PaymentSchema>;

// PIN validation
export const PinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits'),
});

export type PinFormData = z.infer<typeof PinSchema>;

// Settings validation
export const SettingsSchema = z.object({
  shop_name: z.string().min(1, 'Shop name is required'),
  owner_name: z.string().min(1, 'Owner name is required'),
  buying_rate: z.number().positive(),
  selling_rate: z.number().positive(),
  pin_hash: z.string().optional(),
});

export type SettingsFormData = z.infer<typeof SettingsSchema>;

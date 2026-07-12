import { z } from 'zod';

export const CreateExpenseSchema = z.object({
  tripId: z.string().uuid(),
  category: z.enum(['TOLL', 'PARKING', 'FOOD', 'ACCOMMODATION', 'REPAIR', 'OTHER']),
  amount: z.number().positive(),
  description: z.string().min(3),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateExpenseData = z.infer<typeof CreateExpenseSchema>;

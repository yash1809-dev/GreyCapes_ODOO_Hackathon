import { z } from 'zod';

export const CreateFuelSchema = z.object({
  vehicleId: z.string().uuid(),
  tripId: z.string().uuid().optional(),
  liters: z.number().positive(),
  costPerLiter: z.number().positive(),
  totalCost: z.number().positive(),
  odometerReading: z.number().int().positive(),
  fuelStation: z.string().optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateFuelData = z.infer<typeof CreateFuelSchema>;

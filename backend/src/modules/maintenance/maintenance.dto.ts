import { z } from 'zod';

export const CreateMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  maintenanceType: z.enum(['ROUTINE', 'REPAIR', 'INSPECTION', 'EMERGENCY']),
  description: z.string().min(3),
  scheduledDate: z.string().datetime(),
  estimatedCost: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const UpdateMaintenanceSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  actualDate: z.string().datetime().optional(),
  actualCost: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type CreateMaintenanceData = z.infer<typeof CreateMaintenanceSchema>;
export type UpdateMaintenanceData = z.infer<typeof UpdateMaintenanceSchema>;

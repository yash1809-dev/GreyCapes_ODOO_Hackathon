import { z } from 'zod';

/**
 * Login Request Schema
 */
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type LoginDTO = z.infer<typeof LoginSchema>;

/**
 * Refresh Token Request Schema
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;

/**
 * Auth Response
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: {
      id: string;
      name: string;
    };
  };
}

/**
 * User Profile Response
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  permissions: string[];
}

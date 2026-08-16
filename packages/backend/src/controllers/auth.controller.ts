import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AuthError } from '../types/errors.js';

export const authController = {
  /**
   * Send OTP to email
   * Validation: Already done by validateBody middleware
   */
  async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.sendOTP(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify OTP and create/login user
   * Validation: Already done by validateBody middleware
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, role } = req.body;
      const tokens = await authService.verifyOTP(email, otp, role || 'STUDENT');
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refresh access token
   * Validation: Already done by validateBody middleware
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const profile = await authService.getProfile(req.user.userId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  },
};

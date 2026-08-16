import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';

export const authController = {
  /**
   * Send OTP to email
   */
  async sendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Invalid email address' });
        return;
      }

      const result = await authService.sendOTP(email);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to send OTP' });
    }
  },

  /**
   * Verify OTP and create/login user
   */
  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, role } = req.body;

      if (!email || !otp) {
        res.status(400).json({ error: 'Email and OTP are required' });
        return;
      }

      if (role && !['STUDENT', 'PARENT'].includes(role)) {
        res.status(400).json({ error: 'Invalid role. Must be STUDENT or PARENT' });
        return;
      }

      const tokens = await authService.verifyOTP(email, otp, role || 'STUDENT');
      res.json(tokens);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'OTP verification failed' });
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Token refresh failed' });
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const profile = await authService.getProfile(req.user.userId);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch profile' });
    }
  },
};

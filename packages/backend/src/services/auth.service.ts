import jwt, { Secret } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import env from '../config/env.js';

const prisma = new PrismaClient();

// In-memory OTP store (for MVP; use Redis in production)
const otpStore: Record<string, { code: string; expiresAt: number }> = {};

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'STUDENT' | 'PARENT' | 'ADMIN';
}

export const authService = {
  /**
   * Generate and send OTP to email
   * For MVP, OTP is hardcoded as "123456" and logged to console
   */
  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    const otp = '123456'; // Hardcoded for MVP
    const expiresAt = Date.now() + parseInt(env.OTP_EXPIRY_MINUTES) * 60 * 1000;

    otpStore[email] = { code: otp, expiresAt };

    // In production, use SendGrid or similar
    console.log(`\n📧 OTP for ${email}: ${otp} (expires in ${env.OTP_EXPIRY_MINUTES} minutes)\n`);

    return {
      success: true,
      message: 'OTP sent to email',
    };
  },

  /**
   * Verify OTP and create/get user
   */
  async verifyOTP(
    email: string,
    otp: string,
    role: 'STUDENT' | 'PARENT' = 'STUDENT'
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    // Check if OTP exists and is valid
    const storedOTP = otpStore[email];
    if (!storedOTP) {
      throw new Error('OTP not found. Please request a new OTP.');
    }

    if (storedOTP.code !== otp) {
      throw new Error('Invalid OTP');
    }

    if (storedOTP.expiresAt < Date.now()) {
      delete otpStore[email];
      throw new Error('OTP expired. Please request a new OTP.');
    }

    // Delete used OTP
    delete otpStore[email];

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: { email, role },
      });

      // Create student or parent profile
      if (role === 'STUDENT') {
        await prisma.student.create({
          data: {
            userId: user.id,
            name: email.split('@')[0], // Use email prefix as default name
            gradeLevel: 10,
            subjects: [],
          },
        });

        // Create StudentStats for gamification
        await prisma.studentStats.create({
          data: {
            studentId: (await prisma.student.findUnique({ where: { userId: user.id } }))!.id,
          },
        });
      } else if (role === 'PARENT') {
        await prisma.parent.create({
          data: {
            userId: user.id,
            name: email.split('@')[0],
          },
        });
      }
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id, email, role }, env.JWT_SECRET as unknown as Secret, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId: user.id }, env.JWT_SECRET as unknown as Secret, {
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
      userId: user.id,
    };
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET as unknown as Secret) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        env.JWT_SECRET as unknown as Secret,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  },

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<{
    id: string;
    email: string;
    role: string;
    profile: any;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await prisma.student.findUnique({
        where: { userId: user.id },
        include: {
          stats: true,
        },
      });
    } else if (user.role === 'PARENT') {
      profile = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: {
          linkedStudents: {
            include: { student: true },
          },
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile,
    };
  },
};

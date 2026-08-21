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
   * DEMO MODE: OTP is hardcoded as "123456" for easy testing
   * In production, integrate with SendGrid or similar email service
   */
  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const otp = '123456'; // Hardcoded for DEMO - use SendGrid in production
    const expiresAt = Date.now() + parseInt(env.OTP_EXPIRY_MINUTES) * 60 * 1000;

    otpStore[normalizedEmail] = { code: otp, expiresAt };

    // DEMO MODE: Log to console. In production, use SendGrid or similar
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║ 📧 DEMO OTP - Use this to login:                              ║
╠════════════════════════════════════════════════════════════════╣
║ Email: ${normalizedEmail.padEnd(56)} ║
║ OTP Code: ${otp.padEnd(52)} ║
║ Expires in: ${env.OTP_EXPIRY_MINUTES} minutes${' '.padEnd(42)} ║
╚════════════════════════════════════════════════════════════════╝
`);

    return {
      success: true,
      message: `OTP sent to ${email} (Demo: use code ${otp})`,
    };
  },

  /**
   * Verify OTP and create/get user
   * DEMO MODE: Accepts hardcoded "123456" OTP
   */
  async verifyOTP(
    email: string,
    otp: string,
    role: 'STUDENT' | 'PARENT' = 'STUDENT'
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Debug logging
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║ 🔐 OTP VERIFICATION ATTEMPT                                    ║
╠════════════════════════════════════════════════════════════════╣
║ Email: ${normalizedEmail.padEnd(56)} ║
║ Provided OTP: ${otp.padEnd(52)} ║
║ OTP Store State: ${(Object.keys(otpStore).join(', ') || 'EMPTY').padEnd(45)} ║
╚════════════════════════════════════════════════════════════════╝
`);

    // Check if OTP exists and is valid
    const storedOTP = otpStore[normalizedEmail];
    if (!storedOTP) {
      console.error(`❌ OTP not found for: ${normalizedEmail}`);
      console.error(`   Available emails in store: ${Object.keys(otpStore).join(', ') || 'NONE'}`);
      throw new Error('OTP not found. Please request a new OTP.');
    }

    if (storedOTP.code !== otp) {
      console.error(`❌ Invalid OTP - Expected: ${storedOTP.code}, Got: ${otp}`);
      throw new Error('Invalid OTP');
    }

    if (storedOTP.expiresAt < Date.now()) {
      delete otpStore[normalizedEmail];
      console.error(`❌ OTP expired for: ${normalizedEmail}`);
      throw new Error('OTP expired. Please request a new OTP.');
    }

    console.log(`✅ OTP verified successfully for: ${normalizedEmail}\n`);

    // Delete used OTP
    delete otpStore[normalizedEmail];

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: { email: normalizedEmail, role },
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
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role },
      env.JWT_SECRET as Secret,
      { expiresIn: env.JWT_EXPIRES_IN } as any
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_SECRET as Secret,
      { expiresIn: '30d' } as any
    );

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║ ✅ USER LOGGED IN SUCCESSFULLY                                 ║
╠════════════════════════════════════════════════════════════════╣
║ User ID: ${user.id.padEnd(56)} ║
║ Email: ${normalizedEmail.padEnd(56)} ║
║ Role: ${role.padEnd(56)} ║
║ Access Token Expires In: ${(env.JWT_EXPIRES_IN || '7d').padEnd(44)} ║
║ Refresh Token Expires In: 30d${' '.padEnd(47)} ║
╚════════════════════════════════════════════════════════════════╝
`);

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
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET as Secret) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        env.JWT_SECRET as Secret,
        { expiresIn: env.JWT_EXPIRES_IN } as any
      );

      console.log(`🔄 Token refreshed for user: ${user.email}`);

      return { accessToken };
    } catch (error) {
      console.error(`❌ Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'PARENT' | 'ADMIN';
  profile?: any;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string, role?: 'STUDENT' | 'PARENT') => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => {
  // Load tokens from localStorage on init
  const savedToken = localStorage.getItem('accessToken');
  const savedRefreshToken = localStorage.getItem('refreshToken');
  const savedUser = localStorage.getItem('user');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    refreshToken: savedRefreshToken,
    isLoading: false,
    error: null,

    sendOTP: async (email: string) => {
      set({ isLoading: true, error: null });
      try {
        await axios.post(`${API_URL}/auth/send-otp`, { email });
        set({ isLoading: false });
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'Failed to send OTP';
        set({ isLoading: false, error: errorMsg });
        throw new Error(errorMsg);
      }
    },

    verifyOTP: async (email: string, otp: string, role = 'STUDENT') => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_URL}/auth/verify-otp`, {
          email,
          otp,
          role,
        });

        const { accessToken, refreshToken, userId } = response.data;

        // Fetch user profile
        const profileResponse = await axios.get(
          `${API_URL}/auth/profile`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const user: User = {
          id: userId,
          email: profileResponse.data.email,
          role: profileResponse.data.role,
          profile: profileResponse.data.profile,
        };

        // Save to localStorage and state
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        set({
          user,
          token: accessToken,
          refreshToken,
          isLoading: false,
        });
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'OTP verification failed';
        set({ isLoading: false, error: errorMsg });
        throw new Error(errorMsg);
      }
    },

    refreshAccessToken: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        set({ token: null, user: null });
        return;
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        set({ token: accessToken });
      } catch (error) {
        // Refresh failed, clear auth
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ token: null, refreshToken: null, user: null });
      }
    },

    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, token: null, refreshToken: null, error: null });
    },

    setUser: (user: User | null) => set({ user }),
    setToken: (token: string | null) => {
      if (token) localStorage.setItem('accessToken', token);
      else localStorage.removeItem('accessToken');
      set({ token });
    },
    setRefreshToken: (token: string | null) => {
      if (token) localStorage.setItem('refreshToken', token);
      else localStorage.removeItem('refreshToken');
      set({ refreshToken: token });
    },
  };
});

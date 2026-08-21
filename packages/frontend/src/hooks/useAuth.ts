import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    token,
    refreshToken,
    isLoading,
    error,
    rateLimitInfo,
    sendOTP,
    verifyOTP,
    refreshAccessToken,
    logout,
    clearRateLimit,
  } = useAuthStore();

  const isAuthenticated = !!token && !!user;

  return {
    user,
    token,
    refreshToken,
    isLoading,
    error,
    rateLimitInfo,
    isAuthenticated,
    sendOTP,
    verifyOTP,
    refreshAccessToken,
    logout,
    clearRateLimit,
  };
};

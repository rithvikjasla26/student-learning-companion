import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    token,
    refreshToken,
    isLoading,
    error,
    sendOTP,
    verifyOTP,
    refreshAccessToken,
    logout,
  } = useAuthStore();

  const isAuthenticated = !!token && !!user;

  return {
    user,
    token,
    refreshToken,
    isLoading,
    error,
    isAuthenticated,
    sendOTP,
    verifyOTP,
    refreshAccessToken,
    logout,
  };
};

/**
 * Simple environment-based authentication
 * Single admin user with credentials from .env file
 */

export const authenticateAdmin = (username: string, password: string): boolean => {
  const envUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin_password_123';
  
  return username === envUsername && password === envPassword;
};

/**
 * Security validation utilities
 */

// Validate share token format
export function validateShareToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // Should be alphanumeric, reasonable length
  const tokenRegex = /^[a-zA-Z0-9]{16,64}$/;
  return tokenRegex.test(token);
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Rate limiting helper for client-side
export function checkRateLimit(key: string, maxAttempts: number = 5, timeWindow: number = 60000): boolean {
  const now = Date.now();
  const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
  
  // Filter attempts within time window
  const recentAttempts = attempts.filter((timestamp: number) => now - timestamp < timeWindow);
  
  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  // Add current attempt
  recentAttempts.push(now);
  localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
  
  return true;
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

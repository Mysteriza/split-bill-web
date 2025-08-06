/** @type {import('next').NextConfig} */

// Import PWA configuration
import withPWA from 'next-pwa';

// PWA settings
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development to avoid caching issues
});

// Main Next.js config
const nextConfig = {
  // Your existing Next.js config can go here if you have any
};

export default pwaConfig(nextConfig);
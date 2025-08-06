/** @type {import('next').NextConfig} */

import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // --- START: ADD THIS LINE ---
  output: 'export',
  // --- END: ADD THIS LINE ---
};

export default pwaConfig(nextConfig);
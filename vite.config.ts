import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base for GitHub Pages; override via env VITE_BASE if your repo is not at root
  base: process.env.VITE_BASE || '/',
});


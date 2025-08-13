#!/usr/bin/env node

// Simple build script that avoids crypto issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building TMMNets Dashboard (crypto-free)...');

try {
  // Clean dist directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist', { recursive: true });
  fs.mkdirSync('dist/spa', { recursive: true });
  fs.mkdirSync('dist/server', { recursive: true });

  console.log('📦 Building frontend...');
  // Build frontend with minimal options
  process.env.NODE_ENV = 'production';
  execSync('npx vite build --mode production', { 
    stdio: 'inherit',
    env: { ...process.env, VITE_DISABLE_CRYPTO: 'true' }
  });

  console.log('🔧 Building server...');
  // Build server
  execSync('npx vite build --config vite.config.server.ts', { 
    stdio: 'inherit' 
  });

  console.log('✅ Build completed successfully!');
  console.log('\n📁 Output:');
  console.log('Frontend: dist/spa/');
  console.log('Backend:  dist/server/');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Project Diagnostics Script
 * Run this to get a quick health check of the project
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Habit Wellness App - Project Diagnostics\n');

// Check environment
console.log('📋 Environment Check:');
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);
console.log(`   ✅ .env file: ${envExists ? 'Found' : '❌ Missing (copy .env.example)'}`);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];
  
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(`${varName}=`);
    console.log(`   ${hasVar ? '✅' : '❌'} ${varName}: ${hasVar ? 'Set' : 'Missing'}`);
  });
}

// Check dependencies
console.log('\n📦 Dependencies:');
try {
  execSync('pnpm list --depth=0', { stdio: 'ignore' });
  console.log('   ✅ Dependencies installed');
} catch {
  console.log('   ❌ Dependencies missing (run: pnpm install)');
}

// Check database
console.log('\n🗄️  Database:');
const prismaGenerated = fs.existsSync(path.join(process.cwd(), 'src/generated/prisma'));
console.log(`   ${prismaGenerated ? '✅' : '❌'} Prisma client: ${prismaGenerated ? 'Generated' : 'Missing (run: pnpm db:generate)'}`);

// Check for common issues
console.log('\n⚠️  Common Issues Check:');
const srcPath = path.join(process.cwd(), 'src');
let issueCount = 0;

// Check for console.logs
const checkForConsoleLogs = (dir: string): number => {
  let count = 0;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('test')) {
      count += checkForConsoleLogs(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(/console\.(log|error|warn)/g);
      if (matches) count += matches.length;
    }
  });
  
  return count;
};

const consoleCount = checkForConsoleLogs(srcPath);
if (consoleCount > 0) {
  console.log(`   ⚠️  Found ${consoleCount} console.log statements (use logger instead)`);
  issueCount++;
}

// Check for any types
const checkForAnyTypes = (dir: string): number => {
  let count = 0;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('generated')) {
      count += checkForAnyTypes(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(/:\s*any/g);
      if (matches) count += matches.length;
    }
  });
  
  return count;
};

const anyCount = checkForAnyTypes(srcPath);
if (anyCount > 0) {
  console.log(`   ⚠️  Found ${anyCount} 'any' types (add proper types)`);
  issueCount++;
}

if (issueCount === 0) {
  console.log('   ✅ No common issues found');
}

// Project stats
console.log('\n📊 Project Stats:');
const countFiles = (dir: string, extension: string): number => {
  let count = 0;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      count += countFiles(filePath, extension);
    } else if (file.endsWith(extension)) {
      count++;
    }
  });
  
  return count;
};

console.log(`   📄 TypeScript files: ${countFiles(srcPath, '.ts') + countFiles(srcPath, '.tsx')}`);
console.log(`   🧪 Test files: ${countFiles(srcPath, '.test.ts') + countFiles(srcPath, '.test.tsx')}`);
console.log(`   🛣️  API routes: ${countFiles(path.join(srcPath, 'app/api'), 'route.ts')}`);

// Development readiness
console.log('\n🚀 Development Readiness:');
const checks = [
  envExists,
  prismaGenerated,
  issueCount === 0
];
const ready = checks.every(check => check);

if (ready) {
  console.log('   ✅ Ready for development! Run: pnpm dev');
} else {
  console.log('   ❌ Fix the issues above before starting development');
}

console.log('\n📚 Quick Start Commands:');
console.log('   pnpm dev          - Start development server');
console.log('   pnpm test         - Run tests');
console.log('   pnpm db:studio    - Open database GUI');
console.log('   pnpm lint         - Check code quality');

console.log('\n---\nDiagnostics complete!');
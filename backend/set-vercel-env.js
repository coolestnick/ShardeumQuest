#!/usr/bin/env node

/**
 * Script to help set Vercel environment variables
 * This reads your local .env and shows you what to set in Vercel Dashboard
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Vercel Environment Variables Setup Helper\n');

// Read local .env file
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ No .env file found in backend directory');
  console.log('📝 Create a .env file with your MongoDB connection string first');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

console.log('📋 Found these environment variables in your .env file:');
console.log('=' .repeat(60));

const envVars = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
    
    // Show preview for sensitive values
    if (key.includes('URI') || key.includes('SECRET') || key.includes('KEY')) {
      const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`${key}: ${preview}`);
    } else {
      console.log(`${key}: ${value}`);
    }
  }
});

console.log('\n🎯 To fix your Vercel deployment:');
console.log('=' .repeat(60));
console.log('1. Go to: https://vercel.com/dashboard');
console.log('2. Select your backend project');
console.log('3. Go to Settings → Environment Variables');
console.log('4. Add these variables:\n');

// Essential variables for Vercel
const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'NODE_ENV'];

requiredVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`✅ ${varName}`);
    console.log(`   Value: ${envVars[varName]}`);
    console.log(`   Environment: Production, Preview, Development\n`);
  } else if (varName === 'JWT_SECRET') {
    console.log(`⚠️  ${varName} (MISSING - add this)`);
    console.log(`   Value: your-super-secure-jwt-secret-key-here`);
    console.log(`   Environment: Production, Preview, Development\n`);
  } else if (varName === 'NODE_ENV') {
    console.log(`⚠️  ${varName} (MISSING - add this)`);
    console.log(`   Value: production`);
    console.log(`   Environment: Production\n`);
  }
});

console.log('🔄 After setting these variables:');
console.log('   • Redeploy your project (it will auto-redeploy)');
console.log('   • Or manually trigger: vercel --prod\n');

console.log('🧪 Test your deployment:');
if (envVars.MONGODB_URI) {
  console.log('   curl https://your-deployment-url.vercel.app/api/health');
  console.log('   curl https://your-deployment-url.vercel.app/api/db-test\n');
}

console.log('📞 If still having issues, check Vercel Function logs:');
console.log('   vercel logs --follow\n');
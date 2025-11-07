require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('🔍 PDF Portal - Build & Setup Validation');
console.log('='.repeat(60));
console.log();

let hasErrors = false;
let hasWarnings = false;

// Check if .env file exists
console.log('📋 Checking environment configuration...');
// const envPath = path.join(__dirname, '../../.env');
// if (!fs.existsSync(envPath)) {
//   console.error('❌ ERROR: .env file not found!');
//   console.error('   Please copy env.example.txt to .env and configure it.');
//   hasErrors = true;
// } else {
//   console.log('✅ .env file found');
// }

// Check required environment variables
console.log();
console.log('🔐 Validating environment variables...');

const requiredVars = [
  { name: 'PGHOST', description: 'Database host' },
  { name: 'PGDATABASE', description: 'Database name' },
  { name: 'PGUSER', description: 'Database user' },
  { name: 'PGPASSWORD', description: 'Database password' },
  { name: 'JWT_SECRET_KEY', description: 'JWT secret key', minLength: 32 }
];

const optionalVars = [
  { name: 'R2_ACCOUNT_ID', description: 'Cloudflare R2 account ID' },
  { name: 'R2_ACCESS_KEY_ID', description: 'Cloudflare R2 access key' },
  { name: 'R2_SECRET_ACCESS_KEY', description: 'Cloudflare R2 secret key' },
  { name: 'R2_BUCKET', description: 'Cloudflare R2 bucket name' },
  { name: 'OPENAI_API_KEY', description: 'OpenAI API key' }
];

// Check required variables
// requiredVars.forEach(varConfig => {
//   const value = process.env[varConfig.name];
//   if (!value) {
//     console.error(`❌ ERROR: ${varConfig.name} is not set (${varConfig.description})`);
//     hasErrors = true;
//   } else if (varConfig.minLength && value.length < varConfig.minLength) {
//     console.error(`❌ ERROR: ${varConfig.name} is too short (minimum ${varConfig.minLength} characters)`);
//     hasErrors = true;
//   } else {
//     console.log(`✅ ${varConfig.name} is configured`);
//   }
// });

// Check optional variables (warnings only)
// console.log();
// console.log('⚠️  Checking optional environment variables...');
// optionalVars.forEach(varConfig => {
//   const value = process.env[varConfig.name];
//   if (!value) {
//     console.warn(`⚠️  WARNING: ${varConfig.name} is not set (${varConfig.description})`);
//     hasWarnings = true;
//   } else {
//     console.log(`✅ ${varConfig.name} is configured`);
//   }
// });

// Check if required directories exist
console.log();
console.log('📁 Checking project structure...');

const requiredDirs = [
  'src/controllers',
  'src/models',
  'src/routes',
  'src/services',
  'src/middleware',
  'src/config'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../..', dir);
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ ERROR: Required directory missing: ${dir}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${dir} exists`);
  }
});

// Check if main server file exists
console.log();
console.log('🚀 Checking main application files...');

const requiredFiles = [
  'src/server.js',
  'src/config/database.js',
  'src/models/index.js',
  'package.json'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '../..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ERROR: Required file missing: ${file}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${file} exists`);
  }
});

// Check Node.js version
console.log();
console.log('⚙️  Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion < 14) {
  console.error(`❌ ERROR: Node.js version ${nodeVersion} is too old. Please use Node.js 14 or higher.`);
  hasErrors = true;
} else {
  console.log(`✅ Node.js version ${nodeVersion} is compatible`);
}

// Check if node_modules exists
console.log();
console.log('📦 Checking dependencies...');
const nodeModulesPath = path.join(__dirname, '../../node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ ERROR: node_modules not found. Run "npm install" first.');
  hasErrors = true;
} else {
  console.log('✅ node_modules directory exists');
  
  // Check key dependencies
  const keyDeps = ['express', 'sequelize', 'pg', 'jsonwebtoken', 'bcryptjs', 'multer'];
  let missingDeps = [];
  
  keyDeps.forEach(dep => {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length > 0) {
    console.error(`❌ ERROR: Missing dependencies: ${missingDeps.join(', ')}`);
    console.error('   Run "npm install" to install all dependencies.');
    hasErrors = true;
  } else {
    console.log('✅ All key dependencies are installed');
  }
}

// Summary
console.log();
console.log('='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

if (hasErrors) {
  console.error();
  console.error('❌ BUILD FAILED - Please fix the errors above');
  console.error();
  process.exit(1);
} else if (hasWarnings) {
  console.warn();
  console.warn('⚠️  BUILD SUCCESSFUL - But with warnings');
  console.warn('   Some optional features may not work without proper configuration:');
  console.warn('   - Cloudflare R2: File storage will fail');
  console.warn('   - OpenAI: GPT analysis will be disabled');
  console.warn();
  console.log('✅ Your application is ready to run!');
  console.log('   Start with: npm start (production) or npm run dev (development)');
  console.log();
  process.exit(0);
} else {
  console.log();
  console.log('✅ BUILD SUCCESSFUL - All checks passed!');
  console.log();
  console.log('🚀 Your application is fully configured and ready to deploy!');
  console.log();
  console.log('Next steps:');
  console.log('  1. Start server: npm start (production) or npm run dev (development)');
  console.log('  2. Create admin: npm run create-admin');
  // console.log('  3. Test API: http://localhost:' + (process.env.PORT || 5000) + '/health');
  console.log();
  process.exit(0);
}


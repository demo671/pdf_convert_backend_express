require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Company } = require('../models');

/**
 * Diagnostic script to check why a company is getting 403 Forbidden errors
 * Usage: node src/scripts/checkCompanyAccess.js company@email.com
 */

async function checkCompanyAccess() {
  try {
    const companyEmail = process.argv[2];
    
    if (!companyEmail) {
      console.log('❌ Please provide company email');
      console.log('Usage: node src/scripts/checkCompanyAccess.js company@email.com');
      process.exit(1);
    }

    console.log('🔍 Checking company access for:', companyEmail);
    console.log('='.repeat(60));
    
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Check if company exists
    const company = await Company.findOne({ where: { email: companyEmail } });
    
    if (!company) {
      console.log('❌ PROBLEM: Company not found in database');
      console.log('\n📋 Suggested actions:');
      console.log('  1. Register company at /register-company');
      console.log('  2. Verify email is correct\n');
      process.exit(1);
    }

    console.log('✅ Company found in database');
    console.log(`   ID: ${company.id}`);
    console.log(`   Name: ${company.name}`);
    console.log(`   RFC: ${company.rfc}`);
    console.log(`   Status: ${company.status}`);
    console.log(`   User ID: ${company.userId || 'NULL (NO USER ACCOUNT)'}`);
    console.log(`   Approved At: ${company.approvedAt || 'Not approved'}`);
    console.log(`   Has Password Hash: ${company.passwordHash ? 'Yes' : 'No'}\n`);

    // Check company status
    if (company.status === Company.STATUS.PENDING) {
      console.log('❌ PROBLEM: Company is pending approval');
      console.log('\n📋 Suggested actions:');
      console.log('  1. Admin must approve company from User Management page');
      console.log('  2. Go to: Admin → User Management → "Ver empresas pendientes"');
      console.log('  3. Click "Aprobar" button\n');
      process.exit(1);
    }

    if (company.status === Company.STATUS.REJECTED) {
      console.log('❌ PROBLEM: Company was rejected');
      console.log(`   Reason: ${company.rejectionReason || 'Not specified'}`);
      console.log('\n📋 Suggested actions:');
      console.log('  1. Contact administrator');
      console.log('  2. Address rejection reason');
      console.log('  3. Re-register if necessary\n');
      process.exit(1);
    }

    console.log('✅ Company is approved');

    // Check if user account exists
    if (!company.userId) {
      console.log('❌ PROBLEM: No user account created for company');
      console.log('\n📋 Suggested actions:');
      console.log('  Option 1 - Have admin re-approve:');
      console.log('    1. Admin changes status back to pending:');
      console.log(`       UPDATE companies SET status = 'pending' WHERE id = ${company.id};`);
      console.log('    2. Admin approves again with createUserAccount=true');
      console.log('\n  Option 2 - Manually create user:');
      console.log('    Run this SQL:');
      console.log(`    INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)`);
      console.log(`    VALUES ('${company.email}', '${company.passwordHash}', 3, true, NOW(), NOW())`);
      console.log(`    RETURNING id;`);
      console.log(`    -- Then update company:`);
      console.log(`    UPDATE companies SET user_id = (SELECT id FROM users WHERE email = '${company.email}') WHERE id = ${company.id};\n`);
      process.exit(1);
    }

    console.log('✅ User account exists (ID: ' + company.userId + ')');

    // Get user details
    const user = await User.findByPk(company.userId);

    if (!user) {
      console.log('❌ PROBLEM: User account was deleted');
      console.log('\n📋 Suggested actions:');
      console.log('  1. Recreate user account (see above)');
      console.log('  2. Or contact administrator\n');
      process.exit(1);
    }

    console.log('✅ User record found');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role} (${User.getRoleName(user.role)})`);
    console.log(`   Is Active: ${user.isActive}`);
    console.log(`   Created At: ${user.createdAt}\n`);

    // Check user role
    if (user.role !== User.ROLES.COMPANY) {
      console.log('❌ PROBLEM: User has wrong role');
      console.log(`   Current role: ${user.role} (${User.getRoleName(user.role)})`);
      console.log(`   Expected role: ${User.ROLES.COMPANY} (Company)`);
      console.log('\n📋 Suggested actions:');
      console.log('  Fix the role:');
      console.log(`  UPDATE users SET role = 3 WHERE id = ${user.id};`);
      console.log('  Then user must log out and log back in\n');
      process.exit(1);
    }

    console.log('✅ User has correct role (Company)');

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ PROBLEM: User account is inactive');
      console.log('\n📋 Suggested actions:');
      console.log('  Activate the account:');
      console.log(`  UPDATE users SET is_active = true WHERE id = ${user.id};\n`);
      process.exit(1);
    }

    console.log('✅ User account is active');

    // All checks passed
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('='.repeat(60));
    console.log('\nCompany account is properly configured.');
    console.log('\n📋 If still getting 403 errors:');
    console.log('  1. User must LOG OUT completely');
    console.log('  2. Clear browser localStorage (F12 → Application → Clear All)');
    console.log('  3. LOG BACK IN with these credentials:');
    console.log(`     Email: ${company.email}`);
    console.log('     Password: (the one used during registration)');
    console.log('\n  4. After login, new JWT token will have role "Company"');
    console.log('  5. Then try accessing /company dashboard again\n');
    console.log('🔐 Token Verification:');
    console.log('  After logging back in, check browser console for:');
    console.log('  [Auth] User authenticated: company@email.com, Role: Company\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkCompanyAccess();


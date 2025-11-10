/**
 * Fix Company User RFC
 * 
 * This script updates the users table to copy RFC values from the companies table
 * for company users that are missing their RFC.
 * 
 * Usage: node src/scripts/fixCompanyUserRFC.js
 */

require('dotenv').config();
const { User, Company } = require('../models');

async function fixCompanyUserRFC() {
  try {
    console.log('========================================');
    console.log('🔧 Fix Company User RFC Script');
    console.log('========================================\n');

    // Find all approved companies that have a user account
    const companies = await Company.findAll({
      where: {
        status: 'approved',
        userId: { [require('sequelize').Op.not]: null }
      },
      include: [{
        model: User,
        as: 'user',
        required: true
      }]
    });

    console.log(`📊 Found ${companies.length} approved companies with user accounts\n`);

    if (companies.length === 0) {
      console.log('✅ No companies to update');
      process.exit(0);
    }

    let updatedCount = 0;
    let alreadyCorrectCount = 0;

    for (const company of companies) {
      const user = company.user;
      
      console.log(`\n📋 Company: ${company.name}`);
      console.log(`   Email: ${company.email}`);
      console.log(`   Company RFC: ${company.rfc}`);
      console.log(`   User RFC: ${user.rfc || '(null)'}`);

      if (!user.rfc || user.rfc !== company.rfc) {
        // Update user RFC
        await user.update({ rfc: company.rfc });
        console.log(`   ✅ Updated user RFC from "${user.rfc || '(null)'}" to "${company.rfc}"`);
        updatedCount++;
      } else {
        console.log(`   ℹ️ User RFC already correct`);
        alreadyCorrectCount++;
      }
    }

    console.log('\n========================================');
    console.log('📊 Summary:');
    console.log(`   Total companies checked: ${companies.length}`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ℹ️ Already correct: ${alreadyCorrectCount}`);
    console.log('========================================');
    console.log('✅ Script completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing company user RFC:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
fixCompanyUserRFC();


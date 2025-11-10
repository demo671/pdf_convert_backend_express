/**
 * Check Client Companies Status
 * 
 * This script checks the status of client_companies table and related data
 * 
 * Usage: node src/scripts/checkClientCompanies.js
 */

require('dotenv').config();
const { User, Company, ClientCompany, sequelize } = require('../models');

async function checkClientCompanies() {
  try {
    console.log('========================================');
    console.log('🔍 Client Companies Diagnostic Script');
    console.log('========================================\n');

    // Check if client_companies table exists
    console.log('📋 Step 1: Checking if client_companies table exists...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'client_companies';
    `);
    
    if (tables.length === 0) {
      console.log('❌ client_companies table does NOT exist!');
      console.log('💡 Run: npm run migrate');
      process.exit(1);
    }
    console.log('✅ client_companies table exists\n');

    // Check table structure
    console.log('📋 Step 2: Checking table structure...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'client_companies'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log();

    // Count records in client_companies
    console.log('📋 Step 3: Checking client_companies records...');
    const clientCompanyCount = await ClientCompany.count();
    console.log(`Total records: ${clientCompanyCount}\n`);

    if (clientCompanyCount > 0) {
      const clientCompanies = await ClientCompany.findAll({
        limit: 10
      });

      console.log('Sample records:');
      for (const cc of clientCompanies) {
        const client = await User.findByPk(cc.clientUserId, { attributes: ['id', 'email', 'role'] });
        const company = await Company.findByPk(cc.companyId, { attributes: ['id', 'name', 'rfc', 'status'] });
        
        console.log(`\n  Record ID: ${cc.id}`);
        console.log(`   Client: ${client?.email || 'Unknown'} (ID: ${cc.clientUserId})`);
        console.log(`   Company: ${company?.name || 'Unknown'} (ID: ${cc.companyId})`);
        console.log(`   Created: ${cc.createdAt}`);
      }
    } else {
      console.log('ℹ️ No records found in client_companies table');
    }
    console.log();

    // Check how many clients exist
    console.log('📋 Step 4: Checking clients (role = 2)...');
    const clients = await User.findAll({
      where: { role: 2 }, // Client role
      attributes: ['id', 'email', 'rfc', 'isActive']
    });
    console.log(`Total clients: ${clients.length}`);
    if (clients.length > 0) {
      console.log('Sample clients:');
      clients.slice(0, 5).forEach((client, idx) => {
        console.log(`  ${idx + 1}. ${client.email} (ID: ${client.id}, RFC: ${client.rfc || 'none'})`);
      });
    }
    console.log();

    // Check how many approved companies exist
    console.log('📋 Step 5: Checking approved companies...');
    const approvedCompanies = await Company.findAll({
      where: { status: 'approved' },
      attributes: ['id', 'name', 'rfc', 'email', 'status']
    });
    console.log(`Total approved companies: ${approvedCompanies.length}`);
    if (approvedCompanies.length > 0) {
      console.log('Approved companies:');
      approvedCompanies.forEach((company, idx) => {
        console.log(`  ${idx + 1}. ${company.name} (ID: ${company.id}, RFC: ${company.rfc})`);
      });
    } else {
      console.log('⚠️ No approved companies found!');
      console.log('💡 Clients can only add approved companies to their list');
    }
    console.log();

    // Check for pending companies
    console.log('📋 Step 6: Checking pending companies...');
    const pendingCompanies = await Company.findAll({
      where: { status: 'pending' },
      attributes: ['id', 'name', 'rfc', 'email', 'status']
    });
    console.log(`Total pending companies: ${pendingCompanies.length}`);
    if (pendingCompanies.length > 0) {
      console.log('Pending companies (need admin approval):');
      pendingCompanies.forEach((company, idx) => {
        console.log(`  ${idx + 1}. ${company.name} (ID: ${company.id}, RFC: ${company.rfc})`);
      });
      console.log('\n💡 These companies need to be approved by admin before clients can add them');
    }
    console.log();

    console.log('========================================');
    console.log('📊 Summary:');
    console.log(`  ✅ client_companies table: EXISTS`);
    console.log(`  📊 Client-Company associations: ${clientCompanyCount}`);
    console.log(`  👥 Total clients: ${clients.length}`);
    console.log(`  🏢 Approved companies: ${approvedCompanies.length}`);
    console.log(`  ⏳ Pending companies: ${pendingCompanies.length}`);
    
    if (clientCompanyCount === 0 && clients.length > 0 && approvedCompanies.length > 0) {
      console.log('\n⚠️ WARNING: You have clients and approved companies, but no associations!');
      console.log('💡 Possible issues:');
      console.log('   1. Clients haven\'t tried to add companies yet');
      console.log('   2. There\'s an error when trying to add companies (check server logs)');
      console.log('   3. Frontend is not calling the API correctly');
    }
    
    if (approvedCompanies.length === 0 && pendingCompanies.length > 0) {
      console.log('\n💡 ACTION NEEDED: Approve pending companies so clients can add them!');
    }
    
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error checking client companies:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
checkClientCompanies();


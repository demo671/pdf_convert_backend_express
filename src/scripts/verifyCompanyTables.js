require('dotenv').config();
const { sequelize } = require('../config/database');

async function verifyCompanyTables() {
  try {
    console.log('🔍 Verifying company-related database tables...\n');
    
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Check companies table
    const companiesTableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'companies'
      );
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`Companies table: ${companiesTableExists[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);

    // Check client_companies table
    const clientCompaniesTableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'client_companies'
      );
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`Client_companies table: ${clientCompaniesTableExists[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);

    // If both tables exist, check structure
    if (companiesTableExists[0].exists && clientCompaniesTableExists[0].exists) {
      console.log('\n📋 Checking table structures...\n');

      // Check companies table columns
      const companiesColumns = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'companies'
        ORDER BY ordinal_position;
      `, { type: sequelize.QueryTypes.SELECT });

      console.log('Companies table columns:');
      companiesColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
      });

      // Check client_companies table columns
      const clientCompaniesColumns = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'client_companies'
        ORDER BY ordinal_position;
      `, { type: sequelize.QueryTypes.SELECT });

      console.log('\nClient_companies table columns:');
      clientCompaniesColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
      });

      // Check foreign key constraints
      const constraints = await sequelize.query(`
        SELECT
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'client_companies';
      `, { type: sequelize.QueryTypes.SELECT });

      console.log('\nForeign key constraints:');
      constraints.forEach(constraint => {
        console.log(`  - ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      });

      // Check if there are any existing records
      const companiesCount = await sequelize.query(`
        SELECT COUNT(*) as count FROM companies;
      `, { type: sequelize.QueryTypes.SELECT });

      const clientCompaniesCount = await sequelize.query(`
        SELECT COUNT(*) as count FROM client_companies;
      `, { type: sequelize.QueryTypes.SELECT });

      console.log('\n📊 Record counts:');
      console.log(`  Companies: ${companiesCount[0].count}`);
      console.log(`  Client-Company associations: ${clientCompaniesCount[0].count}`);

      // Show sample of approved companies
      const approvedCompanies = await sequelize.query(`
        SELECT id, name, rfc, status FROM companies WHERE status = 'approved' LIMIT 5;
      `, { type: sequelize.QueryTypes.SELECT });

      if (approvedCompanies.length > 0) {
        console.log('\n✅ Approved companies (sample):');
        approvedCompanies.forEach(company => {
          console.log(`  - ID: ${company.id}, Name: ${company.name}, RFC: ${company.rfc}`);
        });
      }

      console.log('\n✅ All company tables are properly configured!\n');
    } else {
      console.log('\n❌ Some tables are missing. Please run: npm run migrate:companies\n');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

verifyCompanyTables();


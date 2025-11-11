require('dotenv').config();
const { sequelize } = require('../database');

/**
 * Remove phone column from companies table
 * WhatsApp will be the only phone contact method
 */

async function runMigration() {
  try {
    console.log('='.repeat(80));
    console.log('🚀 Starting Phone Column Removal Migration');
    console.log('='.repeat(80));
    console.log();

    // Test connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    console.log();

    // ============================================
    // Remove phone column from companies table
    // ============================================
    console.log('📋 Removing phone column from companies table...');
    try {
      await sequelize.query(`
        ALTER TABLE companies
        DROP COLUMN IF EXISTS phone;
      `);
      console.log('✅ phone column removed from companies table');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('ℹ️  phone column does not exist in companies table (already removed)');
      } else {
        throw error;
      }
    }
    console.log();

    console.log('='.repeat(80));
    console.log('✅ Phone Column Removal Migration Completed Successfully');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  });

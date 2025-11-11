require('dotenv').config();
const { sequelize } = require('../database');

/**
 * Add WhatsApp column to users and companies tables
 */

async function runMigration() {
  try {
    console.log('='.repeat(80));
    console.log('🚀 Starting WhatsApp Column Migration');
    console.log('='.repeat(80));
    console.log();

    // Test connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    console.log();

    // ============================================
    // 1. Add whatsapp column to users table
    // ============================================
    console.log('📋 Step 1: Adding whatsapp column to users table...');
    try {
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
      `);
      console.log('✅ whatsapp column added to users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  whatsapp column already exists in users table');
      } else {
        throw error;
      }
    }
    console.log();

    // ============================================
    // 2. Add whatsapp column to companies table
    // ============================================
    console.log('📋 Step 2: Adding whatsapp column to companies table...');
    try {
      await sequelize.query(`
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
      `);
      console.log('✅ whatsapp column added to companies table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  whatsapp column already exists in companies table');
      } else {
        throw error;
      }
    }
    console.log();

    console.log('='.repeat(80));
    console.log('✅ WhatsApp Column Migration Completed Successfully');
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

require('dotenv').config();
const { sequelize } = require('../config/database');

async function addIsDeletedByClientField() {
  try {
    console.log('='.repeat(60));
    console.log('🔧 Adding isDeletedByClient field to document_processeds table');
    console.log('='.repeat(60));
    console.log();

    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    console.log();

    // Add the column using raw SQL
    console.log('📊 Adding is_deleted_by_client column...');
    
    await sequelize.query(`
      ALTER TABLE document_processeds 
      ADD COLUMN IF NOT EXISTS is_deleted_by_client BOOLEAN NOT NULL DEFAULT false;
    `);

    console.log('✅ Column added successfully');
    console.log();

    // Update all existing records to have is_deleted_by_client = false
    console.log('🔄 Updating existing records...');
    const [results] = await sequelize.query(`
      UPDATE document_processeds 
      SET is_deleted_by_client = false 
      WHERE is_deleted_by_client IS NULL;
    `);
    
    console.log(`✅ Updated records (if any)`);
    console.log();
    console.log('Migration completed successfully!');
    console.log();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addIsDeletedByClientField();


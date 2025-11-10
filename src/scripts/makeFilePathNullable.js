const { sequelize, testConnection } = require('../models');

console.log('='.repeat(60));
console.log('🔄 Making file_path nullable in document_originals table');
console.log('='.repeat(60));
console.log();

async function makeFilePathNullable() {
  try {
    // Test connection
    await testConnection();

    console.log('📊 Altering document_originals table...');
    console.log('ℹ️  Reason: Original PDFs are no longer saved to storage');
    console.log('ℹ️  Only processed PDFs will be saved to Cloudflare R2');
    console.log();

    // Alter the column to allow NULL
    await sequelize.query(`
      ALTER TABLE document_originals
      MODIFY COLUMN file_path VARCHAR(500) NULL;
    `);

    console.log('✅ Column file_path is now nullable');
    console.log();

    // Update existing records with NULL if needed (optional)
    console.log('ℹ️  Note: Existing records with file_path will keep their values');
    console.log('ℹ️  New uploads will have file_path = NULL');
    console.log();
    console.log('Migration completed successfully!');
    console.log();

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

makeFilePathNullable();

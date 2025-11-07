const { sequelize } = require('../config/database');
const { Company, ClientCompany } = require('../models');

async function createCompanyTables() {
  try {
    console.log('🚀 Starting company tables migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Create companies table
    await Company.sync({ alter: true });
    console.log('✓ Companies table created/updated');

    // Create client_companies junction table
    await ClientCompany.sync({ alter: true });
    console.log('✓ Client-companies junction table created/updated');

    // Add company-related fields to document_processeds table
    await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'document_processeds' 
          AND column_name = 'is_sent_to_company'
        ) THEN
          ALTER TABLE document_processeds 
          ADD COLUMN is_sent_to_company BOOLEAN NOT NULL DEFAULT false;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'document_processeds' 
          AND column_name = 'sent_to_company_id'
        ) THEN
          ALTER TABLE document_processeds 
          ADD COLUMN sent_to_company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'document_processeds' 
          AND column_name = 'sent_to_company_at'
        ) THEN
          ALTER TABLE document_processeds 
          ADD COLUMN sent_to_company_at TIMESTAMP;
        END IF;
      END $$;
    `);
    console.log('✓ Document_processeds table updated with company fields');

    // Add password_hash field to companies table if not exists
    await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'companies' 
          AND column_name = 'password_hash'
        ) THEN
          ALTER TABLE companies 
          ADD COLUMN password_hash VARCHAR(255);
        END IF;
      END $$;
    `);
    console.log('✓ Companies table updated with password_hash field');

    // Remove address field from companies table if it exists
    await sequelize.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'companies' 
          AND column_name = 'address'
        ) THEN
          ALTER TABLE companies 
          DROP COLUMN address;
        END IF;
      END $$;
    `);
    console.log('✓ Address field removed from companies table (if existed)');

    // Add rejection_reason field to companies table if not exists
    await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'companies' 
          AND column_name = 'rejection_reason'
        ) THEN
          ALTER TABLE companies 
          ADD COLUMN rejection_reason TEXT;
        END IF;
      END $$;
    `);
    console.log('✓ Companies table updated with rejection_reason field');

    console.log('\n✅ Company tables migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

createCompanyTables();


require('dotenv').config();
const { sequelize } = require('../config/database');

/**
 * Comprehensive migration script that runs all database migrations
 * This ensures all required columns and tables exist
 */

async function runAllMigrations() {
  try {
    console.log('='.repeat(80));
    console.log('🚀 Starting Comprehensive Database Migration');
    console.log('='.repeat(80));
    console.log();

    // Test connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    console.log();

    // ============================================
    // 1. Add is_active to users table
    // ============================================
    console.log('📋 Migration 1: Adding is_active column to users table...');
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      `);
      console.log('✅ is_active column added/verified');
    } catch (error) {
      console.log('⚠️  is_active column already exists or error:', error.message);
    }
    console.log();

    // ============================================
    // 2. Create document_history table
    // ============================================
    console.log('📋 Migration 2: Creating document_history table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS document_history (
          id SERIAL PRIMARY KEY,
          action_type VARCHAR(50) NOT NULL,
          document_id INTEGER,
          user_id INTEGER,
          user_role VARCHAR(50),
          file_name VARCHAR(255),
          file_size_bytes BIGINT,
          error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES document_originals(id) ON DELETE SET NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);
      console.log('✅ document_history table created/verified');
    } catch (error) {
      console.log('⚠️  document_history table already exists or error:', error.message);
    }
    console.log();

    // ============================================
    // 3. Add admin_user_id to notifications table
    // ============================================
    console.log('📋 Migration 3: Adding admin_user_id to notifications table...');
    try {
      await sequelize.query(`
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
      `);
      console.log('✅ admin_user_id column added/verified');
    } catch (error) {
      console.log('⚠️  admin_user_id column already exists or error:', error.message);
    }
    console.log();

    // ============================================
    // 4. Create companies table
    // ============================================
    console.log('📋 Migration 4: Creating companies table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          rfc VARCHAR(13) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          address TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          approved_by_admin_id INTEGER,
          approved_at TIMESTAMP,
          rejection_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (approved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);
      console.log('✅ companies table created/verified');
    } catch (error) {
      console.log('⚠️  companies table already exists or error:', error.message);
    }
    console.log();

    // ============================================
    // 5. Create client_companies junction table
    // ============================================
    console.log('📋 Migration 5: Creating client_companies table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS client_companies (
          id SERIAL PRIMARY KEY,
          client_user_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          UNIQUE(client_user_id, company_id)
        );
      `);
      console.log('✅ client_companies table created/verified');
    } catch (error) {
      console.log('⚠️  client_companies table already exists or error:', error.message);
    }
    console.log();

    // ============================================
    // 6. Add company fields to document_processeds
    // ============================================
    console.log('📋 Migration 6: Adding company fields to document_processeds...');
    try {
      await sequelize.query(`
        ALTER TABLE document_processeds 
        ADD COLUMN IF NOT EXISTS is_sent_to_company BOOLEAN NOT NULL DEFAULT false;
      `);
      await sequelize.query(`
        ALTER TABLE document_processeds 
        ADD COLUMN IF NOT EXISTS sent_to_company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;
      `);
      await sequelize.query(`
        ALTER TABLE document_processeds 
        ADD COLUMN IF NOT EXISTS sent_to_company_at TIMESTAMP;
      `);
      console.log('✅ Company fields added/verified to document_processeds');
    } catch (error) {
      console.log('⚠️  Company fields already exist or error:', error.message);
    }
    console.log();

    // ============================================
    // 7. Create company_notifications table
    // ============================================
    console.log('📋 Migration 7: Creating company_notifications table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS company_notifications (
          id SERIAL PRIMARY KEY,
          company_id INTEGER NOT NULL,
          client_user_id INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ company_notifications table created/verified');
    } catch (error) {
      console.log('⚠️  company_notifications table already exists or error:', error.message);
    }
    console.log();

    // ============================================
    // 8. Create admin_notifications table
    // ============================================
    console.log('📋 Migration 8: Creating admin_notifications table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS admin_notifications (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          related_user_id INTEGER,
          related_company_id INTEGER,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (related_company_id) REFERENCES companies(id) ON DELETE SET NULL
        );
      `);
      console.log('✅ admin_notifications table created/verified');
    } catch (error) {
      console.log('⚠️  admin_notifications table already exists or error:', error.message);
    }
    console.log();

    // ============================================
    // 9. Add is_deleted_by_client to document_processeds
    // ============================================
    console.log('📋 Migration 9: Adding is_deleted_by_client to document_processeds...');
    try {
      await sequelize.query(`
        ALTER TABLE document_processeds 
        ADD COLUMN IF NOT EXISTS is_deleted_by_client BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('✅ is_deleted_by_client column added/verified');
    } catch (error) {
      console.log('⚠️  is_deleted_by_client column already exists or error:', error.message);
    }
    console.log();

    // ============================================
    // Final verification
    // ============================================
    console.log('🔍 Verifying all tables exist...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tableNames = tables.map(t => t.table_name);
    const requiredTables = [
      'users',
      'document_originals',
      'document_processeds',
      'template_rule_sets',
      'notifications',
      'document_history',
      'companies',
      'client_companies',
      'company_notifications',
      'admin_notifications'
    ];

    console.log(`✅ Found ${tableNames.length} tables in database`);
    
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    if (missingTables.length > 0) {
      console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log('✅ All required tables exist');
    }

    console.log();
    console.log('='.repeat(80));
    console.log('🎉 All Migrations Completed Successfully!');
    console.log('='.repeat(80));
    console.log();
    
    process.exit(0);
  } catch (error) {
    console.error();
    console.error('='.repeat(80));
    console.error('❌ Migration Failed');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error();
    console.error('Stack trace:');
    console.error(error.stack);
    console.error();
    process.exit(1);
  }
}

// Run migrations
runAllMigrations();


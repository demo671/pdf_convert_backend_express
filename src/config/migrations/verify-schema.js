require('dotenv').config();
const { sequelize } = require('../database');

/**
 * Verification script to check all tables and columns exist
 */

async function verifySchema() {
  try {
    console.log('='.repeat(80));
    console.log('🔍 Verifying Database Schema');
    console.log('='.repeat(80));
    console.log();

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Define expected schema
    const expectedSchema = {
      users: [
        'id', 'email', 'rfc', 'password_hash', 'role', 'is_active', 
        'created_at', 'updated_at'
      ],
      companies: [
        'id', 'name', 'rfc', 'email', 'phone', 'password_hash', 'user_id',
        'status', 'approved_at', 'approved_by_admin_id', 'rejection_reason',
        'created_at', 'updated_at'
      ],
      client_companies: [
        'id', 'client_user_id', 'company_id', 'created_at'
      ],
      template_rule_sets: [
        'id', 'name', 'json_definition', 'created_by_user_id', 'is_active',
        'created_at', 'updated_at'
      ],
      document_originals: [
        'id', 'uploader_user_id', 'file_path', 'original_file_name',
        'file_size_bytes', 'uploaded_at', 'upload_batch_id', 'status'
      ],
      document_processeds: [
        'id', 'source_document_id', 'template_rule_set_id', 'file_path_final_pdf',
        'extracted_json_data', 'approved_at', 'created_at', 'status',
        'is_deleted_by_client', 'is_sent_to_admin', 'sent_to_admin_at',
        'is_sent_to_company', 'sent_to_company_id', 'sent_to_company_at'
      ],
      document_history: [
        'id', 'action_type', 'document_id', 'user_id', 'user_role',
        'file_name', 'file_size_bytes', 'batch_id', 'processing_time_ms',
        'error_message', 'metadata', 'created_at'
      ],
      notifications: [
        'id', 'client_user_id', 'admin_user_id', 'document_count',
        'sent_at', 'is_read', 'created_at'
      ],
      admin_notifications: [
        'id', 'notification_type', 'related_user_id', 'related_company_id',
        'message', 'is_read', 'created_at'
      ],
      company_notifications: [
        'id', 'company_id', 'client_user_id', 'document_count',
        'sent_at', 'is_read', 'created_at'
      ]
    };

    let allValid = true;
    let totalTables = 0;
    let totalColumns = 0;

    // Check each table
    for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
      totalTables++;
      console.log(`📋 Checking table: ${tableName}`);

      // Get actual columns
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);

      if (columns.length === 0) {
        console.log(`   ❌ Table '${tableName}' does NOT exist!`);
        allValid = false;
        continue;
      }

      const actualColumns = columns.map(c => c.column_name);
      
      // Check for missing columns
      const missingColumns = expectedColumns.filter(c => !actualColumns.includes(c));
      
      // Check for extra columns
      const extraColumns = actualColumns.filter(c => !expectedColumns.includes(c));

      if (missingColumns.length > 0) {
        console.log(`   ❌ Missing columns: ${missingColumns.join(', ')}`);
        allValid = false;
      }

      if (extraColumns.length > 0) {
        console.log(`   ⚠️  Extra columns: ${extraColumns.join(', ')}`);
      }

      if (missingColumns.length === 0 && extraColumns.length === 0) {
        console.log(`   ✅ All ${expectedColumns.length} columns present`);
        totalColumns += expectedColumns.length;
      } else {
        console.log(`   ℹ️  Expected: ${expectedColumns.length}, Found: ${actualColumns.length}`);
      }

      // Show column details
      console.log(`   📊 Columns: ${actualColumns.join(', ')}`);
      console.log();
    }

    // Get all tables in database
    const [allTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const allTableNames = allTables.map(t => t.table_name);
    const unexpectedTables = allTableNames.filter(t => !Object.keys(expectedSchema).includes(t));

    if (unexpectedTables.length > 0) {
      console.log('⚠️  Unexpected tables in database:');
      unexpectedTables.forEach(t => console.log(`   - ${t}`));
      console.log();
    }

    // Summary
    console.log('='.repeat(80));
    console.log('📊 Schema Verification Summary');
    console.log('='.repeat(80));
    console.log(`✅ Expected tables: ${Object.keys(expectedSchema).length}`);
    console.log(`✅ Found tables: ${allTableNames.length}`);
    console.log(`✅ Total columns verified: ${totalColumns}`);
    
    if (unexpectedTables.length > 0) {
      console.log(`⚠️  Unexpected tables: ${unexpectedTables.length}`);
    }

    console.log('='.repeat(80));

    if (allValid) {
      console.log('✅ Schema verification PASSED! All tables and columns are correct.');
      process.exit(0);
    } else {
      console.log('❌ Schema verification FAILED! Please run migrations.');
      process.exit(1);
    }

  } catch (error) {
    console.error();
    console.error('❌ Verification failed:', error.message);
    console.error();
    process.exit(1);
  }
}

// Run verification
verifySchema();


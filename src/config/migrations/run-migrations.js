const { execSync } = require('child_process');

/**
 * Master migration script that runs all migrations in order
 */

const migrations = [
  {
    name: 'Add isActive field to users',
    script: 'src/scripts/addIsActiveField.js',
    description: 'Adds is_active column to users table'
  },
  {
    name: 'Create document_history table',
    script: 'src/scripts/createDocumentHistoryTable.js',
    description: 'Creates permanent document history tracking table'
  },
  {
    name: 'Add adminUserId to notifications',
    script: 'src/scripts/addAdminUserIdToNotifications.js',
    description: 'Adds admin_user_id column to notifications table'
  },
  {
    name: 'Create company tables',
    script: 'src/scripts/createCompanyTables.js',
    description: 'Creates companies and client_companies tables, adds company fields to document_processeds'
  },
  {
    name: 'Create notification tables',
    script: 'src/scripts/createNotificationTables.js',
    description: 'Creates company_notifications and admin_notifications tables'
  },
  {
    name: 'Add isDeletedByClient field',
    script: 'src/scripts/addIsDeletedByClient.js',
    description: 'Adds is_deleted_by_client column to document_processeds table'
  }
];

async function runMigrations() {
  console.log('🚀 Starting all migrations...\n');
  
  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Running: ${migration.name}`);
    console.log(`   ${migration.description}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      execSync(`node ${migration.script}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      successCount++;
      console.log(`\n✅ ${migration.name} - SUCCESS\n`);
    } catch (error) {
      failureCount++;
      console.error(`\n❌ ${migration.name} - FAILED`);
      console.error(`Error: ${error.message}\n`);
      
      // Ask if user wants to continue
      console.log('⚠️  Migration failed. Stopping...');
      process.exit(1);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Migration Summary:');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📝 Total: ${migrations.length}`);
  console.log(`${'='.repeat(60)}\n`);

  if (failureCount === 0) {
    console.log('🎉 All migrations completed successfully!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some migrations failed. Please review the errors above.\n');
    process.exit(1);
  }
}

runMigrations();


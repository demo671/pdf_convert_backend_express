const { sequelize, DocumentHistory } = require('../models');

async function createDocumentHistoryTable() {
  try {
    console.log('='.repeat(60));
    console.log('📊 Creating Document History Table');
    console.log('='.repeat(60));
    console.log();

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    console.log();

    // Create table if it doesn't exist
    console.log('📋 Creating document_history table...');
    
    await DocumentHistory.sync({ force: false });
    
    console.log('✅ document_history table created successfully!');
    console.log();

    // Show table info
    const count = await DocumentHistory.count();
    console.log(`📊 Current records in document_history: ${count}`);
    console.log();

    console.log('='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    console.log();
    console.log('🎯 Next Steps:');
    console.log('   1. Restart your backend server: npm run dev');
    console.log('   2. Upload a document to start tracking history');
    console.log('   3. View analytics to see permanent stats');
    console.log();
    
    process.exit(0);
  } catch (error) {
    console.error();
    console.error('❌ Migration failed:', error.message);
    console.error();
    console.error('Stack trace:', error.stack);
    console.error();
    console.error('💡 Troubleshooting:');
    console.error('   1. Check your database connection in .env');
    console.error('   2. Ensure PostgreSQL is running');
    console.error('   3. Verify database credentials');
    console.error();
    process.exit(1);
  }
}

// Run migration
createDocumentHistoryTable();


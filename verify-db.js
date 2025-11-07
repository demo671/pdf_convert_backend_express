// Quick verification script to check database connection and tables
require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function verifyDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Check tables
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    
    console.log('\n📋 Tables in database:');
    tables.forEach(t => console.log('  -', t.table_name));
    
    console.log('\n📊 Required tables:');
    const required = [
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
    
    const existing = tables.map(t => t.table_name);
    required.forEach(r => {
      const exists = existing.includes(r);
      console.log(`  ${exists ? '✅' : '❌'} ${r}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDatabase();

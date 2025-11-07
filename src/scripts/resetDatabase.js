require('dotenv').config();
const readline = require('readline');
const { sequelize, User, DocumentOriginal, DocumentProcessed, TemplateRuleSet, Notification, testConnection } = require('../models');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

console.log('='.repeat(60));
console.log('⚠️  PDF Portal - Database Reset');
console.log('='.repeat(60));
console.log();
console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!');
console.log();

async function resetDatabase() {
  try {
    // Test connection
    await testConnection();

    // Confirm action
    const answer = await question('Are you sure you want to reset the database? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Database reset cancelled');
      rl.close();
      process.exit(0);
    }

    console.log();
    console.log('🗑️  Dropping all tables...');

    // Drop tables in correct order (respecting foreign keys)
    await Notification.drop();
    console.log('   ✓ Notifications table dropped');
    
    await DocumentProcessed.drop();
    console.log('   ✓ DocumentProcessed table dropped');
    
    await DocumentOriginal.drop();
    console.log('   ✓ DocumentOriginal table dropped');
    
    await TemplateRuleSet.drop();
    console.log('   ✓ TemplateRuleSet table dropped');
    
    await User.drop();
    console.log('   ✓ Users table dropped');

    console.log();
    console.log('✅ All tables dropped successfully!');
    console.log();
    console.log('📊 Recreating tables...');

    // Recreate tables
    await sequelize.sync({ force: false });
    console.log('✅ Tables recreated successfully!');
    
    console.log();
    console.log('🌱 Database has been reset. Run "npm run seed" to populate with default data.');
    console.log();

    rl.close();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error();
    console.error('❌ Database reset failed:', error.message);
    console.error();
    rl.close();
    process.exit(1);
  }
}

resetDatabase();


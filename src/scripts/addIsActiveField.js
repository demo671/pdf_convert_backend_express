const { sequelize, User, testConnection } = require('../models');

console.log('='.repeat(60));
console.log('🔄 Adding isActive field to existing users');
console.log('='.repeat(60));
console.log();

async function addIsActiveField() {
  try {
    // Test connection
    await testConnection();
    
    // Sync database to add new column
    console.log('📊 Syncing database to add isActive column...');
    await sequelize.sync({ alter: true }); // This will add the missing column
    console.log('✅ Database synchronized');
    console.log();

    // Update all existing users to be active by default
    console.log('🔄 Setting all existing users to active...');
    const [updated] = await User.update(
      { isActive: true },
      { where: {} }
    );
    
    console.log(`✅ Updated ${updated} users to active status`);
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

addIsActiveField();


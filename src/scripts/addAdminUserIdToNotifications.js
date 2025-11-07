const { sequelize } = require('../config/database');

async function addAdminUserIdField() {
  try {
    console.log('='.repeat(60));
    console.log('🔧 Adding admin_user_id Field to Notifications Table');
    console.log('='.repeat(60));
    console.log();

    await sequelize.authenticate();
    console.log('✅ Database connection established');
    console.log();

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notifications' 
      AND column_name='admin_user_id';
    `);

    if (results.length > 0) {
      console.log('ℹ️  Column admin_user_id already exists in notifications table');
    } else {
      console.log('📋 Adding admin_user_id column...');
      
      await sequelize.query(`
        ALTER TABLE notifications 
        ADD COLUMN admin_user_id INTEGER REFERENCES users(id);
      `);
      
      await sequelize.query(`
        COMMENT ON COLUMN notifications.admin_user_id IS 'Which admin this notification is for';
      `);
      
      console.log('✅ Column admin_user_id added successfully!');
    }

    console.log();
    console.log('='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    console.log();
    
    process.exit(0);
  } catch (error) {
    console.error();
    console.error('❌ Migration failed:', error.message);
    console.error();
    console.error('Stack trace:', error.stack);
    console.error();
    process.exit(1);
  }
}

addAdminUserIdField();


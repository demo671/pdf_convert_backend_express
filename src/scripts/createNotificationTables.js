const { sequelize } = require('../config/database');
const { CompanyNotification, AdminNotification } = require('../models');

async function createNotificationTables() {
  try {
    console.log('🚀 Starting notification tables migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Create company_notifications table
    await CompanyNotification.sync({ alter: true });
    console.log('✓ Company_notifications table created/updated');

    // Create admin_notifications table
    await AdminNotification.sync({ alter: true });
    console.log('✓ Admin_notifications table created/updated');

    console.log('\n✅ Notification tables migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

createNotificationTables();


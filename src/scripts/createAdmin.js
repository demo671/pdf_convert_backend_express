require('dotenv').config();
const readline = require('readline');
const authService = require('../services/authService');
const { User, sequelize, testConnection } = require('../models');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createAdmin() {
  try {
    console.log('='.repeat(60));
    console.log('PDF Portal - Create Admin User');
    console.log('='.repeat(60));
    console.log();

    // Test database connection
    await testConnection();

    // Get admin details
    const email = await question('Admin email (must end with @admin.com): ');
    
    if (!email.endsWith('@admin.com')) {
      console.error('❌ Error: Email must end with @admin.com');
      rl.close();
      process.exit(1);
    }

    const password = await question('Admin password: ');

    if (password.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters long');
      rl.close();
      process.exit(1);
    }

    // Check if admin already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.error('❌ Error: User with this email already exists');
      rl.close();
      process.exit(1);
    }

    // Create admin user
    const user = await authService.registerUser(email, password, User.ROLES.ADMIN);

    if (user) {
      console.log();
      console.log('✅ Admin user created successfully!');
      console.log();
      console.log('Admin Details:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: Admin`);
      console.log(`  Created At: ${user.createdAt}`);
      console.log();
    } else {
      console.error('❌ Error: Failed to create admin user');
    }

    rl.close();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();


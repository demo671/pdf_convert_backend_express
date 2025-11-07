require('dotenv').config();
const { TemplateRuleSet } = require('../models');

async function removeExtraTemplates() {
  try {
    console.log('='.repeat(60));
    console.log('🗑️  Removing Extra Templates');
    console.log('='.repeat(60));
    console.log();

    // Find and delete Mexican Invoice template
    const mexicanTemplate = await TemplateRuleSet.findOne({
      where: { name: 'Plantilla Factura Mexicana' }
    });

    if (mexicanTemplate) {
      await mexicanTemplate.destroy();
      console.log('✅ Removed: Plantilla Factura Mexicana');
    } else {
      console.log('ℹ️  Mexican Invoice template not found (already removed)');
    }

    console.log();
    
    // Show remaining templates
    const remainingTemplates = await TemplateRuleSet.findAll();
    console.log(`📋 Remaining Templates: ${remainingTemplates.length}`);
    
    remainingTemplates.forEach(template => {
      console.log(`   - ${template.name} (ID: ${template.id}, Active: ${template.isActive})`);
    });

    console.log();
    console.log('✅ Template cleanup completed successfully!');
    console.log();
    
    process.exit(0);
  } catch (error) {
    console.error();
    console.error('❌ Template cleanup failed:', error.message);
    console.error();
    console.error('Stack trace:', error.stack);
    console.error();
    process.exit(1);
  }
}

// Run cleanup
removeExtraTemplates();


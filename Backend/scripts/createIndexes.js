const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure indexes are created
const Prescription = require('../Model/Prescription');
const AuditLog = require('../Model/AuditLog');

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medipredict');
    console.log('Connected to MongoDB');

    // Create indexes for Prescription model
    console.log('Creating indexes for Prescription model...');
    await Prescription.createIndexes();
    console.log('✅ Prescription indexes created successfully');

    // Create indexes for AuditLog model
    console.log('Creating indexes for AuditLog model...');
    await AuditLog.createIndexes();
    console.log('✅ AuditLog indexes created successfully');

    // List all indexes for verification
    console.log('\n📋 Prescription Collection Indexes:');
    const prescriptionIndexes = await Prescription.collection.getIndexes();
    Object.keys(prescriptionIndexes).forEach(indexName => {
      console.log(`  - ${indexName}: ${JSON.stringify(prescriptionIndexes[indexName])}`);
    });

    console.log('\n📋 AuditLog Collection Indexes:');
    const auditLogIndexes = await AuditLog.collection.getIndexes();
    Object.keys(auditLogIndexes).forEach(indexName => {
      console.log(`  - ${indexName}: ${JSON.stringify(auditLogIndexes[indexName])}`);
    });

    console.log('\n🎉 All indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createIndexes();
}

module.exports = createIndexes;
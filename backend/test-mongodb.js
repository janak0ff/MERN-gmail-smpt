const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully!');
    
    // Test if we can create and save a document
    const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
    const testDoc = new TestModel({ name: 'Test Document' });
    await testDoc.save();
    console.log('✅ Test document saved successfully!');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed. All tests passed!');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔑 Authentication failed. Please check:');
      console.log('1. Your MongoDB password in the .env file');
      console.log('2. That the user "janak123g_db_user" exists in MongoDB Atlas');
      console.log('3. That the user has correct permissions');
    } else if (error.message.includes('getaddrinfo')) {
      console.log('\n🌐 Network error. Please check:');
      console.log('1. Your internet connection');
      console.log('2. That your IP is whitelisted in MongoDB Atlas');
    }
  }
};

testConnection();
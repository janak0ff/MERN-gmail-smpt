const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const testConnection = async () => {
  try {
    const dbSource = process.env.DB_SOURCE || 'local';
    let mongoURI = process.env.MONGODB_URI;

    if (dbSource === 'cloud') {
      mongoURI = process.env.MONGODB_URI_CLOUD;
      console.log('Testing Cloud MongoDB Atlas Connection...');
    } else {
      mongoURI = process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/mern_smtp';
      console.log('Testing Local MongoDB Connection...');
    }

    console.log('Connection string:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    await mongoose.connect(mongoURI, {
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
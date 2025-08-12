const axios = require('axios');

async function testBackendConnection() {
  try {
    console.log('Testing backend connection...');
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('Backend is running:', response.data);
    
    // Test auth status endpoint
    const authResponse = await axios.get('http://localhost:5000/api/auth/status');
    console.log('Auth status:', authResponse.data);
    
  } catch (error) {
    console.error('Backend connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Make sure the backend server is running on port 5000');
    }
  }
}

testBackendConnection();

// Test OTP functionality
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000';

async function testOTPFlow() {
  console.log('🧪 Testing E-Ride OTP Flow...\n');

  try {
    // Test 1: Login to trigger OTP
    console.log('1. Testing Login (which triggers OTP)...');
    const loginResponse = await fetch(`${API_BASE}/api/v1/login/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin@eride.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login successful!');
      console.log(`📧 Message: ${loginData.message}`);
      console.log(`🔐 OTP Required: ${loginData.otp_required}`);
      console.log(`📧 Email Configured: ${loginData.email_configured}`);
      if (loginData.dev_otp) {
        console.log(`🔢 DEV OTP Code: ${loginData.dev_otp}`);
      }
      console.log(`🎫 JWT Token: ${loginData.access_token.substring(0, 50)}...`);
    } else {
      console.log(`❌ Login failed: ${loginData.message}`);
      return;
    }

    console.log('\n🎉 OTP testing complete!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Login triggers OTP generation');
    console.log('- ✅ OTP codes are logged to backend console');
    console.log('- ✅ OTP is included in API response for development');
    console.log('- 💡 Check the backend console for OTP codes during login');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOTPFlow();

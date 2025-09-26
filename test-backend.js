const fetch = require('node-fetch');

const API_URL = 'http://localhost:8000';

async function testBackend() {
    console.log('🧪 Testing E-Ride Backend APIs...\n');
    
    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const healthResponse = await fetch(`${API_URL}/api/v1/utils/health-check/`);
        const healthData = await healthResponse.json();
        console.log('✅ Health Check:', healthData.message);
        
        // Test 2: User Registration
        console.log('\n2. Testing User Registration...');
        const registerResponse = await fetch(`${API_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testuser@eride.com',
                password: 'password123',
                full_name: 'Test User',
                role: 'rider'
            })
        });
        
        if (registerResponse.ok) {
            const registerData = await registerResponse.json();
            console.log('✅ Registration:', registerData.message);
        } else {
            const registerError = await registerResponse.json();
            console.log('⚠️  Registration (expected if user exists):', registerError.message);
        }
        
        // Test 3: User Login
        console.log('\n3. Testing User Login...');
        const loginResponse = await fetch(`${API_URL}/api/v1/login/access-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin@eride.com',
                password: 'admin123'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Login successful:', loginData.message);
            console.log('🔐 OTP Code for testing:', loginData.message.match(/\d{6}/)?.[0]);
            
            // Test 4: OTP Verification
            console.log('\n4. Testing OTP Verification...');
            const otpMatch = loginData.message.match(/\d{6}/);
            if (otpMatch) {
                const otpCode = otpMatch[0];
                const otpResponse = await fetch(`${API_URL}/api/v1/auth/otp/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'admin@eride.com',
                        code: otpCode
                    })
                });
                
                if (otpResponse.ok) {
                    const otpData = await otpResponse.json();
                    console.log('✅ OTP Verification successful');
                    console.log('👤 User:', otpData.user.full_name, `(${otpData.user.email})`);
                } else {
                    const otpError = await otpResponse.json();
                    console.log('❌ OTP Verification failed:', otpError.message);
                }
            }
        } else {
            const loginError = await loginResponse.json();
            console.log('❌ Login failed:', loginError.message);
        }
        
        // Test 5: Password Recovery
        console.log('\n5. Testing Password Recovery...');
        const recoveryResponse = await fetch(`${API_URL}/api/v1/password-recovery/admin@eride.com`, {
            method: 'POST'
        });
        
        if (recoveryResponse.ok) {
            const recoveryData = await recoveryResponse.json();
            console.log('✅ Password Recovery:', recoveryData.message);
        } else {
            const recoveryError = await recoveryResponse.json();
            console.log('❌ Password Recovery failed:', recoveryError.message);
        }
        
        console.log('\n🎉 Backend testing complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure the backend server is running with: node server.js');
    }
}

testBackend();

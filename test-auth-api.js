// Script test Authentication API endpoints
const BASE_URL = 'http://localhost:3000/api/auth';

async function testAuthAPI() {
  console.log('🔐 Testing Authentication API Endpoints\n');

  let authToken = null;

  try {
    // Test 1: Register new user
    console.log('📝 Testing POST /api/auth/register...');
    const registerData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`, // Unique email
      password: 'password123',
      role: 'reader'
    };

    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();

    if (registerResponse.ok) {
      console.log('✅ Register API working!');
      console.log(`👤 Created user: ${registerResult.user.name} (${registerResult.user.email})`);
      console.log(`🔰 Role: ${registerResult.user.role}`);
    } else {
      console.log('❌ Register API failed:', registerResult);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Login with the registered user
    console.log('🔑 Testing POST /api/auth/login...');
    const loginData = {
      email: registerData.email,
      password: registerData.password
    };

    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    const loginResult = await loginResponse.json();

    if (loginResponse.ok) {
      console.log('✅ Login API working!');
      console.log(`👤 Logged in as: ${loginResult.user.name}`);
      console.log(`🎫 Token received: ${loginResult.token.substring(0, 50)}...`);
      authToken = loginResult.token;
    } else {
      console.log('❌ Login API failed:', loginResult);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get current user info (requires auth)
    if (authToken) {
      console.log('👤 Testing GET /api/auth/me (with token)...');
      const meResponse = await fetch(`${BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const meResult = await meResponse.json();

      if (meResponse.ok) {
        console.log('✅ Me API working!');
        console.log('📄 User details:');
        console.log(`   Name: ${meResult.user.name}`);
        console.log(`   Email: ${meResult.user.email}`);
        console.log(`   Role: ${meResult.user.role}`);
        console.log(`   Articles count: ${meResult.user.articles_count}`);
        console.log(`   Created: ${new Date(meResult.user.created_at).toLocaleDateString('vi-VN')}`);
      } else {
        console.log('❌ Me API failed:', meResult);
      }

      console.log('\n' + '='.repeat(50) + '\n');

      // Test 4: Logout
      console.log('🚪 Testing POST /api/auth/logout...');
      const logoutResponse = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const logoutResult = await logoutResponse.json();

      if (logoutResponse.ok) {
        console.log('✅ Logout API working!');
        console.log(`📤 ${logoutResult.message}`);
      } else {
        console.log('❌ Logout API failed:', logoutResult);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Try to access protected endpoint without token
    console.log('🔒 Testing GET /api/auth/me (without token)...');
    const unauthorizedResponse = await fetch(`${BASE_URL}/me`);
    const unauthorizedResult = await unauthorizedResponse.json();

    if (unauthorizedResponse.status === 401) {
      console.log('✅ Protected endpoint working correctly!');
      console.log(`🚫 ${unauthorizedResult.error}`);
    } else {
      console.log('❌ Protected endpoint should return 401:', unauthorizedResult);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 6: Try to register with existing email
    console.log('📧 Testing duplicate email registration...');
    const duplicateResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData) // Same email
    });

    const duplicateResult = await duplicateResponse.json();

    if (duplicateResponse.status === 409) {
      console.log('✅ Duplicate email validation working!');
      console.log(`🚫 ${duplicateResult.error}`);
    } else {
      console.log('❌ Should prevent duplicate email:', duplicateResult);
    }

    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🎉 All Authentication API tests completed!');

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure your Next.js dev server is running: npm run dev');
    console.log('💡 Also ensure your database is set up and migrations are applied');
  }
}

// Run the test
testAuthAPI();

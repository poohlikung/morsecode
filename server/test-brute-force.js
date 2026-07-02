const { exec } = require('child_process');

async function testBruteForce() {
  console.log('🏁 Starting Brute Force Protection Test...');
  const url = 'http://localhost:3001/api/auth/login';
  
  // Clean state: we will use a unique username for this test run
  const testUser = 'bruteforce_test_user_' + Date.now();
  console.log(`👤 Using test username: ${testUser}`);

  console.log('\n--- Step 1: Performing 5 incorrect login attempts ---');
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUser, password: 'wrongpassword' })
      });
      const data = await response.json();
      console.log(`Attempt ${i}: Status = ${response.status}, Error = "${data.error}"`);
    } catch (err) {
      console.error(`Attempt ${i} failed:`, err.message);
    }
  }

  console.log('\n--- Step 2: Testing the 6th attempt (Should be blocked) ---');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUser, password: 'wrongpassword' })
    });
    const data = await response.json();
    console.log(`Attempt 6: Status = ${response.status}`);
    console.log(`Response body:`, data);
    
    if (response.status === 429) {
      console.log('\n✅ TEST PASSED: Brute force protection blocked the 6th attempt with a 429 status code!');
    } else {
      console.log('\n❌ TEST FAILED: The 6th attempt was not blocked with 429!');
    }
  } catch (err) {
    console.error('Attempt 6 connection failed:', err.message);
  }
}

testBruteForce();

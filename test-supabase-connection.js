// Quick test script to verify Supabase connection
// Run with: node test-supabase-connection.js

const SUPABASE_URL = 'https://nxbuioobdluvdhgjqtee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YnVpb29iZGx1dmRoZ2pxdGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyOTcyNzMsImV4cCI6MjA2MTg3MzI3M30.HFIP9LpbZp-KKVNClZDFsRPSZmTGIy_TqYFLPmjrYvg';

console.log('Testing Supabase connection...\n');

// Test 1: Check if URL is accessible
console.log('1. Testing URL accessibility:');
fetch(`${SUPABASE_URL}/rest/v1/`)
  .then(response => {
    if (response.ok || response.status === 404 || response.status === 401) {
      console.log('   ✓ Supabase URL is accessible');
      return true;
    } else {
      console.log(`   ✗ Unexpected status: ${response.status}`);
      return false;
    }
  })
  .catch(error => {
    console.log('   ✗ Cannot reach Supabase URL');
    console.log('   Error:', error.message);
  })
  .then(() => {
    // Test 2: Check profiles table
    console.log('\n2. Testing profiles table access:');
    return fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
  })
  .then(response => {
    if (response.ok) {
      console.log('   ✓ profiles table exists and is accessible');
      return response.json();
    } else if (response.status === 404) {
      console.log('   ✗ profiles table not found - you need to run the SQL setup');
    } else if (response.status === 401) {
      console.log('   ✗ Authentication failed - check your API key');
    } else {
      console.log(`   ✗ Error accessing table: ${response.status}`);
    }
    return null;
  })
  .then(data => {
    if (data !== null) {
      console.log(`   Found ${data.length} profile(s)`);
    }

    // Test 3: Check auth endpoint
    console.log('\n3. Testing auth endpoint:');
    return fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      }
    });
  })
  .then(response => {
    if (response.ok) {
      console.log('   ✓ Auth service is working');
    } else {
      console.log(`   ✗ Auth service error: ${response.status}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('Connection test complete!');
    console.log('='.repeat(50) + '\n');

    console.log('Next steps:');
    console.log('1. If you see errors, run the SQL setup in Supabase Dashboard');
    console.log('2. Go to: https://supabase.com/dashboard/project/nxbuioobdluvdhgjqtee/sql/new');
    console.log('3. Copy and paste the content from: supabase_sql/complete_setup.sql');
    console.log('4. Click "Run" to execute the setup');
    console.log('5. Restart your Expo app: press "r" or Ctrl+C and npm start');
  })
  .catch(error => {
    console.log('\n✗ Test failed with error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Check your internet connection');
    console.log('- Verify Supabase project is not paused');
    console.log('- Run the SQL setup in Supabase Dashboard');
  });

// Debug script to check environment variables
// This helps verify that Expo is loading your .env file correctly

console.log('='.repeat(60));
console.log('ENVIRONMENT VARIABLES CHECK');
console.log('='.repeat(60));

console.log('\n1. Checking if environment variables are loaded:\n');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('EXPO_PUBLIC_SUPABASE_URL:', url || '❌ NOT FOUND');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', key ? '✓ Found (length: ' + key.length + ')' : '❌ NOT FOUND');

if (key) {
  console.log('Key starts with:', key.substring(0, 20) + '...');
  console.log('Key ends with:', '...' + key.substring(key.length - 20));
}

console.log('\n' + '='.repeat(60));
console.log('EXPECTED VALUES:');
console.log('='.repeat(60));
console.log('URL should be: https://nxbuioobdluvdhgjqtee.supabase.co');
console.log('Key should start with: eyJhbGciOiJIUzI1NiIs...');
console.log('Key length should be around: 200-250 characters');

console.log('\n' + '='.repeat(60));
console.log('NEXT STEPS:');
console.log('='.repeat(60));

if (!url || !key) {
  console.log('\n❌ Environment variables not loaded!');
  console.log('\nTo fix:');
  console.log('1. Make sure .env file exists in project root');
  console.log('2. Restart Expo dev server completely (Ctrl+C then npm start)');
  console.log('3. Clear Metro bundler cache: npx expo start -c');
} else if (key.length < 100) {
  console.log('\n⚠️  API key seems too short!');
  console.log('\nTo fix:');
  console.log('1. Go to Supabase Dashboard → Settings → API');
  console.log('2. Copy the full "anon public" key (it\'s very long)');
  console.log('3. Update .env file with the complete key');
  console.log('4. Restart Expo: Ctrl+C then npm start');
} else {
  console.log('\n✓ Environment variables look correct!');
  console.log('\nIf you still get "Invalid API key" error:');
  console.log('1. Verify your Supabase project is active (not paused)');
  console.log('2. Check Settings → API in Supabase Dashboard');
  console.log('3. Make sure you copied the "anon public" key (not service_role)');
}

console.log('\n');

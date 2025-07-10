// Environment and Configuration Validator
require('dotenv').config();

function validateEnvironment() {
  console.log('🔍 Validating Environment Configuration...\n');

  const required = {
    'AUTH_SECRET': process.env.AUTH_SECRET,
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
    'DATABASE_URL': process.env.DATABASE_URL,
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
  };

  let allValid = true;

  for (const [key, value] of Object.entries(required)) {
    if (value) {
      console.log(`✅ ${key}: Configured`);
    } else {
      console.log(`❌ ${key}: Missing or empty`);
      allValid = false;
    }
  }

  console.log(`\n📊 Environment Status: ${allValid ? '✅ Valid' : '❌ Issues found'}`);
  
  if (process.env.NEXTAUTH_URL === 'http://localhost:3000') {
    console.log('🔧 Running in LOCAL development mode');
  } else {
    console.log('🚀 Running in PRODUCTION mode');
  }

  console.log('\n🔗 Expected URLs:');
  console.log(`- App: ${process.env.NEXTAUTH_URL}`);
  console.log(`- Signup: ${process.env.NEXTAUTH_URL}/signup`);
  console.log(`- Login: ${process.env.NEXTAUTH_URL}/login`);
  console.log(`- Dashboard: ${process.env.NEXTAUTH_URL}/dashboard`);

  return allValid;
}

if (validateEnvironment()) {
  console.log('\n🎉 Environment is properly configured!');
} else {
  console.log('\n⚠️ Please fix the environment issues above.');
}

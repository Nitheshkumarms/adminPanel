require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

async function makeAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    // Force token refresh
    await admin.auth().revokeRefreshTokens(user.uid);
    
    console.log(`✅ Success! ${email} is now an admin`);
    console.log(`User UID: ${user.uid}`);
  } catch (error) {
    console.error('❌ Error making admin:', error.message);
  } finally {
    process.exit();
  }
}

// Run with the email you want to make admin
makeAdmin('admin@stores.com');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Firebase Admin SDK with service account key file
let serviceAccount;
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

// Check if serviceAccountKey.json exists
if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ Using serviceAccountKey.json for Firebase configuration');
  serviceAccount = require(serviceAccountPath);
} else {
  console.log('⚠️  serviceAccountKey.json not found. Please ensure it exists in the backend folder.');
  console.log('📁 Expected location:', serviceAccountPath);
  
  // Create a minimal service account object for basic Firebase connection
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "loginpagetask-de75d",
    private_key_id: "dummy-key-id",
    private_key: "-----BEGIN PRIVATE KEY-----\ndummy-key\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk-fbsvc@loginpagetask-de75d.iam.gserviceaccount.com",
    client_id: "dummy-client-id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40loginpagetask-de75d.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  };
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.log('📝 Please ensure serviceAccountKey.json is properly configured');
  }
}

// Get Firestore instance
const db = admin.firestore();

// Get Auth instance
const auth = admin.auth();

module.exports = {
  admin,
  db,
  auth,
  serviceAccount
};

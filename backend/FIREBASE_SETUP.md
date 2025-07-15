# Firebase Service Account Setup

## Steps to Get Your Firebase Service Account Key:

### 1. Go to Firebase Console
- Visit [Firebase Console](https://console.firebase.google.com/)
- Select your project: `loginpagetask-de75d`

### 2. Navigate to Service Accounts
- Click on the gear icon (⚙️) next to "Project Overview"
- Select "Project settings"
- Click on the "Service accounts" tab

### 3. Generate New Private Key
- Click on "Generate new private key"
- A JSON file will be downloaded to your computer

### 4. Place the File
- Rename the downloaded file to `serviceAccountKey.json`
- Place it in the `backend` folder: `C:\Users\ZAM\Desktop\task 5 login page\backend\serviceAccountKey.json`

### 5. Verify the Structure
Your `serviceAccountKey.json` should look like this:
```json
{
  "type": "service_account",
  "project_id": "loginpagetask-de75d",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@loginpagetask-de75d.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "...",
  "universe_domain": "googleapis.com"
}
```

### 6. Security Note
- The `serviceAccountKey.json` file is already in `.gitignore`
- It will NOT be committed to the repository
- Keep this file secure and do not share it

### 7. Test the Setup
After placing the file, run:
```bash
npm run dev
```

You should see: `✅ Using serviceAccountKey.json for Firebase configuration`

## Troubleshooting

If you see `⚠️ serviceAccountKey.json not found`, check:
1. File is named exactly `serviceAccountKey.json`
2. File is in the correct location: `backend/serviceAccountKey.json`
3. File contains valid JSON format
4. All required fields are present

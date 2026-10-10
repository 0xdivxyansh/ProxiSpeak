# Firebase Setup Guide for ProxiSpeak

This guide explains how to set up Google Firebase for ProxiSpeak, configure authentication, deploy security rules and indexes, and obtain credentials for the backend.

---

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g., `proxispeak-prod` or `proxispeak-dev`).
4. Choose whether to enable Google Analytics (optional) and click **Create Project**.

---

## 2. Enable Firebase Authentication

1. In the Firebase Console left navigation menu, click **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, enable your desired identity providers:
   - **Email/Password**: Enable for standard credentials testing.
   - **Google**: Optional, recommended for web and mobile clients.
   - **Anonymous**: Optional for temporary guest accounts.
4. Click **Save**.

---

## 3. Provision Cloud Firestore

1. In the Firebase Console, navigate to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose your database location (select a multi-region or region close to your primary audience, e.g., `us-central1`).
4. Select **Start in production mode** (all reads and writes denied by default; our custom rules will govern access).
5. Click **Enable**.

---

## 4. Provision Firebase Cloud Storage

1. Navigate to **Build** > **Storage**.
2. Click **Get started**.
3. Select **Start in production mode**.
4. Choose the default storage bucket location (matching your Firestore location).
5. Click **Done**. Note the bucket name (format: `<project-id>.firebasestorage.app` or `<project-id>.appspot.com`).

---

## 5. Obtain Firebase Service Account Credentials

The ProxiSpeak backend uses the Firebase Admin SDK. It requires credentials to authenticate and generate V4 signed upload and playback URLs.

1. In the Firebase Console, click the **Gear icon** (Project Settings) > **Service accounts**.
2. Ensure **Firebase Admin SDK** is selected.
3. Click **Generate new private key**, then click **Generate key**.
4. A JSON file will download (e.g., `proxispeak-dev-firebase-adminsdk-xxxxx.json`).
5. **Secure the key**:
   - Store it securely on your server or development machine.
   - **Never commit this JSON file to version control.** It is already excluded in `.gitignore`.

### Configuring the Backend:

Option A — **File Path**:
Place the JSON file in your project root as `serviceAccountKey.json` and set in `.env`:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

Option B — **Inline Base64 String** (Best for CI/CD, Docker, or Cloud Run):
Encode the JSON file to base64:
```bash
# On Linux/macOS:
base64 -w 0 serviceAccountKey.json

# On Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))
```
Paste into `.env`:
```env
FIREBASE_SERVICE_ACCOUNT_KEY=<BASE64_STRING>
```

Option C — **Google Cloud Application Default Credentials (ADC)**:
If deploying on Google Cloud Run, App Engine, or Compute Engine, leave both `FIREBASE_SERVICE_ACCOUNT_PATH` and `FIREBASE_SERVICE_ACCOUNT_KEY` empty. Firebase Admin SDK will automatically authenticate using the attached service account.

---

## 6. Deploy Security Rules & Composite Indexes

Install the Firebase CLI if you haven't already:
```bash
npm install -g firebase-tools
```

Log in and select your Firebase project:
```bash
firebase login
firebase use --add <your-project-id>
```

Deploy Firestore Security Rules:
```bash
firebase deploy --only firestore:rules
```

Deploy Storage Security Rules:
```bash
firebase deploy --only storage:rules
```

Deploy Firestore Composite Indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## 7. Local Firebase Emulator Suite (Alternative to Cloud)

For offline development without live cloud credentials:

1. Initialize emulators in your workspace:
   ```bash
   firebase init emulators
   ```
   Select: **Authentication**, **Firestore**, **Storage**, and **Emulator UI**.

2. Start the Emulator Suite:
   ```bash
   firebase emulators:start
   ```

3. Update your `.env` file:
   ```env
   USE_EMULATOR=true
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
   FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
   ```

4. Run the ProxiSpeak backend:
   ```bash
   npm run dev
   ```
   All Firestore queries, Auth token validations, and storage operations will target the local emulator without incurring any cloud costs.

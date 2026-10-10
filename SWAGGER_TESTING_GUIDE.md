# ProxiSpeak Swagger UI & Manual Testing Guide

ProxiSpeak includes interactive OpenAPI 3.0 documentation powered by Swagger UI.

This guide walks you through acquiring a Firebase ID token, authorizing in Swagger, and testing all audio discovery and upload lifecycle endpoints.

---

## 1. Access Swagger UI

Start the backend server:
```bash
npm run dev
```

Open your browser to:
- **Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Raw OpenAPI 3.0 JSON**: [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)

---

## 2. Obtaining a Firebase ID Token

Protected endpoints require a verified Firebase ID token passed as `Bearer <token>`.

### Method A: Using Firebase Auth REST API (Fastest)

1. Find your **Web API Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/) > **Project Settings** > **General**.
   - Copy the **Web API Key**.

2. Sign in or create a test user via curl:
   ```bash
   # Create a user (or sign in with identitytoolkit):
   curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=YOUR_WEB_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"testuser@example.com","password":"Password123!","returnSecureToken":true}'
   ```

   Or sign in existing user:
   ```bash
   curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"testuser@example.com","password":"Password123!","returnSecureToken":true}'
   ```

3. Copy the returned `idToken` from the JSON response.

### Method B: In-Browser JavaScript Console
If you have a frontend app with Firebase initialized:
```javascript
const user = firebase.auth().currentUser;
user.getIdToken().then(token => console.log("YOUR_TOKEN:", token));
```

### Method C: Local Test Environment (Mocks)
When `NODE_ENV=test`, the backend accepts mock tokens in the format:
```
mock-token-<USER_ID>
```
Example: `Bearer mock-token-testuser123`

---

## 3. Authorizing in Swagger UI

1. Open [http://localhost:5000/api-docs](http://localhost:5000/api-docs).
2. Click the green **Authorize** button in the top-right corner.
3. In the **bearerAuth (http, Bearer)** dialog:
   - Enter your token into the **Value** field:
     ```
     <PASTE_YOUR_FIREBASE_ID_TOKEN>
     ```
4. Click **Authorize**, then click **Close**.
5. All subsequent requests to protected endpoints will automatically include the `Authorization: Bearer ...` header.

---

## 4. End-to-End API Walkthrough

### Step 1: Health Check
1. Expand `GET /api/v1/health`.
2. Click **Try it out**, then **Execute**.
3. Verify `200 OK` with `status: "healthy"` and dependencies info.

---

### Step 2: User Profile Management
1. Expand `GET /api/v1/users/me`.
2. Click **Try it out**, then **Execute**.
3. Verify your profile is returned. On first login, your account is automatically provisioned.
4. Expand `PATCH /api/v1/users/me`:
   - Enter request body:
     ```json
     {
       "displayName": "Acoustic Explorer"
     }
     ```
   - Click **Execute** and verify `displayName` updates successfully.

---

### Step 3: Initiate Audio Upload
1. Expand `POST /api/v1/audio`.
2. Click **Try it out**.
3. Provide the initial recording metadata:
   ```json
   {
     "title": "Cathedral Bells at Dusk",
     "description": "Bells ringing across the plaza in San Francisco",
     "latitude": 37.7844,
     "longitude": -122.408,
     "visibility": "public",
     "declaredMimeType": "audio/mpeg",
     "declaredSizeBytes": 3145728
   }
   ```
4. Click **Execute**.
5. The response returns `201 Created` with:
   - `audioId`: e.g., `8f3e1a2b-4c5d...`
   - `storagePath`: e.g., `audio/<uid>/8f3e1a2b...mp3`
   - `uploadUrl`: Pre-signed Cloud Storage PUT URL.
   - `expiresAt`: URL expiration timestamp (15 minutes).

---

### Step 4: Binary Upload to Cloud Storage
Using the returned `uploadUrl`, perform the HTTP `PUT` using `curl` or Postman:

```bash
curl -X PUT "<SIGNED_UPLOAD_URL>" \
  -H "Content-Type: audio/mpeg" \
  --data-binary "@path/to/sample.mp3"
```

---

### Step 5: Finalize and Publish Upload
1. Expand `POST /api/v1/audio/{id}/complete`.
2. Enter the `id` from Step 3.
3. Click **Execute**.
4. The server inspects Cloud Storage, confirms the file exists, validates file size and content type, and updates the record status to `published`.
5. Note: This endpoint is **idempotent**—calling it multiple times returns the current published record without error.

---

### Step 6: Discover Audio Recordings Nearby
1. Expand `GET /api/v1/audio/nearby`.
2. Click **Try it out**.
3. Fill in query parameters:
   - `lat`: `37.7844`
   - `lng`: `-122.408`
   - `radius`: `5000` (5km)
   - `limit`: `20`
4. Click **Execute**.
5. The response includes all published recordings within 5km, sorted ascending by `distanceMeters`, along with deterministic pagination cursors.

---

### Step 7: Stream/Download Audio Playback URL
1. Expand `GET /api/v1/audio/{id}/playback`.
2. Enter the audio `id`.
3. Click **Execute**.
4. The response returns a short-lived V4 signed URL in `playbackUrl`.
5. Paste this URL into any browser tab or HTML5 `<audio>` element to stream the recording.

---

### Step 8: Update Metadata
1. Expand `PATCH /api/v1/audio/{id}`.
2. Enter the audio `id` and update fields:
   ```json
   {
     "title": "Cathedral Bells at Sunset",
     "latitude": 37.7850,
     "longitude": -122.4090
   }
   ```
3. Click **Execute**. If coordinates changed, the server recalculates the spatial geohash automatically.

---

### Step 9: Delete Recording
1. Expand `DELETE /api/v1/audio/{id}`.
2. Enter the audio `id`.
3. Click **Execute**.
4. The recording metadata is removed from Firestore and the binary audio file is purged from Cloud Storage.

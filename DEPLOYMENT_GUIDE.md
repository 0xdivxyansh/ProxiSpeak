# ProxiSpeak Production Deployment Guide

This guide details best practices and deployment workflows for hosting the ProxiSpeak backend on modern cloud infrastructure, specifically **Google Cloud Run**, **Google App Engine**, or standard container environments (Docker/Kubernetes).

---

## 1. Cloud Storage Bucket CORS Configuration (Crucial for Web/Mobile Clients)

When frontend clients (React.js, React Native, Leaflet) perform direct binary uploads to the pre-signed URL returned by `POST /api/v1/audio`, Google Cloud Storage enforces CORS policies on browser HTTP `PUT` requests.

Configure your bucket with the provided `cors.json`:

```bash
# Using gcloud CLI:
gcloud storage buckets update gs://YOUR_STORAGE_BUCKET --cors-file=cors.json

# Or using gsutil:
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET
```

---

## 2. Deploying to Google Cloud Run (Recommended)

Google Cloud Run is the optimal deployment target for ProxiSpeak due to its automatic scaling, native Application Default Credentials (ADC) integration, and pay-per-use billing.

### Step 1: Ensure Prerequisites
- Google Cloud SDK (`gcloud`) installed and authenticated:
  ```bash
  gcloud auth login
  gcloud config set project YOUR_PROJECT_ID
  ```

### Step 2: Build and Deploy Container Directly via Cloud Build
```bash
gcloud run deploy proxispeak-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 5000 \
  --set-env-vars NODE_ENV=production,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com,API_BASE_URL=https://your-cloud-run-url.a.run.app,CORS_ORIGIN=https://your-frontend-domain.com
```

### Step 3: Grant IAM Permissions to the Cloud Run Service Account
Cloud Run runs under a default service account (or a custom service account you configure). Ensure it has the necessary roles:

1. **Cloud Datastore User** (`roles/datastore.user`) — Required for Firestore reads, writes, and transactions.
2. **Storage Object Admin** (`roles/storage.objectAdmin`) — Required to generate signed URLs and inspect uploaded audio files.
3. **Firebase Authentication Viewer/Admin** (`roles/firebaseauth.admin`) — Required to verify Firebase ID tokens.

```bash
SERVICE_ACCOUNT="YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/firebaseauth.admin"
```

Because Cloud Run supports Application Default Credentials (ADC) automatically, you do not need to inject a service account JSON file into `.env`!

---

## 3. Deploying using Docker Container

Build the Docker image:
```bash
docker build -t proxispeak-backend:latest .
```

Run the container:
```bash
docker run -d \
  -p 5000:5000 \
  --name proxispeak-api \
  --env-file .env.production \
  proxispeak-backend:latest
```

Health check verification:
```bash
curl http://localhost:5000/api/v1/health
```

---

## 4. Production Checklist

- [ ] `NODE_ENV=production` set.
- [ ] `API_BASE_URL` points to your public HTTPS domain.
- [ ] `CORS_ORIGIN` restricted to your authorized frontend domains (never `*` in production).
- [ ] Firestore indexes deployed via `firebase deploy --only firestore:indexes`.
- [ ] Firestore security rules deployed via `firebase deploy --only firestore:rules`.
- [ ] Storage security rules deployed via `firebase deploy --only storage:rules`.
- [ ] Storage bucket CORS applied via `gcloud storage buckets update ... --cors-file=cors.json`.
- [ ] Rate limits configured appropriately for anticipated traffic (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`).
- [ ] Service account credentials protected via GCP Secret Manager or ADC.
- [ ] Application health monitor configured on `GET /api/v1/health`.

import { env } from './env';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ProxiSpeak API - Geospatial Proximity Audio Discovery',
    version: '1.0.0',
    description: `
### ProxiSpeak Backend REST API

ProxiSpeak enables users to discover, upload, stream, and manage geo-anchored audio recordings.

#### Authentication
Protected endpoints require a Firebase Authentication ID Token passed in the **Authorization** header:
\`Authorization: Bearer <Firebase_ID_Token>\`

To test authenticated endpoints in Swagger UI:
1. Click the **Authorize** button below.
2. Enter your Firebase ID token into the **bearerAuth** value field.
3. Click **Authorize** and close the modal.

#### Complete Audio Upload Workflow:
1. **Initiate Upload (\`POST /api/v1/audio\`)**: Authenticated user submits audio metadata (title, coordinates, MIME type, file size). The server validates the request and returns a secure, single-use, pre-signed upload URL for Google Cloud Storage.
2. **Direct Binary Upload to Storage**: The client performs an HTTP \`PUT\` directly to the returned \`uploadUrl\` with the binary audio payload and the required \`Content-Type\` header.
3. **Complete & Publish (\`POST /api/v1/audio/{id}/complete\`)**: The client notifies the backend. The backend independently verifies the object in Cloud Storage, validates size and MIME type, and transitions status from \`pending_upload\` to \`published\`.
4. **Discovery & Streaming**: Once published, recordings appear in proximity searches (\`GET /api/v1/audio/nearby\`) and secure time-limited playback links can be requested (\`GET /api/v1/audio/{id}/playback\`).
    `,
    contact: {
      name: 'ProxiSpeak Engineering Team',
      url: 'https://github.com/proxispeak',
    },
  },
  servers: [
    {
      url: env.API_BASE_URL,
      description: `${env.NODE_ENV} environment`,
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase ID token issued by Firebase Authentication.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'The request contains invalid fields' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', example: 'latitude' },
                    message: {
                      type: 'string',
                      example: 'Latitude must be between -90 and 90 degrees',
                    },
                  },
                },
              },
            },
            required: ['code', 'message'],
          },
          requestId: { type: 'string', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
        },
        required: ['success', 'error'],
      },
      UserProfile: {
        type: 'object',
        properties: {
          uid: { type: 'string', example: 'k7x9J4m2L0w8Q3p' },
          displayName: { type: 'string', example: 'Alice Explorer' },
          email: { type: 'string', nullable: true, example: 'alice@example.com' },
          status: { type: 'string', enum: ['active', 'suspended', 'deleted'], example: 'active' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-10T10:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-10T12:00:00.000Z' },
        },
        required: ['uid', 'displayName', 'status', 'createdAt', 'updatedAt'],
      },
      UpdateUserProfileRequest: {
        type: 'object',
        properties: {
          displayName: { type: 'string', minLength: 1, maxLength: 100, example: 'Alice Explorer' },
        },
      },
      AudioOwnerPublicInfo: {
        type: 'object',
        properties: {
          uid: { type: 'string', example: 'k7x9J4m2L0w8Q3p' },
          displayName: { type: 'string', example: 'Alice Explorer' },
        },
        required: ['uid', 'displayName'],
      },
      AudioRecording: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '8f3e1a2b-4c5d-6e7f-8a9b-0c1d2e3f4a5b' },
          ownerUid: { type: 'string', example: 'k7x9J4m2L0w8Q3p' },
          title: { type: 'string', example: 'Historic Town Square Acoustic Tour' },
          description: {
            type: 'string',
            example: 'Field recording capturing the central bell tower chime.',
          },
          storagePath: { type: 'string', example: 'audio/k7x9J4m2L0w8Q3p/8f3e1a2b.mp3' },
          latitude: { type: 'number', example: 37.7749 },
          longitude: { type: 'number', example: -122.4194 },
          geohash: { type: 'string', example: '9q8yyk8ytp' },
          mimeType: { type: 'string', example: 'audio/mpeg' },
          sizeBytes: { type: 'integer', example: 3145728 },
          durationSeconds: { type: 'number', nullable: true, example: 124.5 },
          status: {
            type: 'string',
            enum: ['pending_upload', 'uploaded', 'published', 'failed', 'deleting', 'deleted'],
            example: 'published',
          },
          visibility: {
            type: 'string',
            enum: ['public', 'private', 'unlisted'],
            example: 'public',
          },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-10T10:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-10T10:05:00.000Z' },
        },
        required: [
          'id',
          'ownerUid',
          'title',
          'description',
          'storagePath',
          'latitude',
          'longitude',
          'geohash',
          'mimeType',
          'sizeBytes',
          'status',
          'visibility',
          'createdAt',
          'updatedAt',
        ],
      },
      NearbyAudioResult: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '8f3e1a2b-4c5d-6e7f-8a9b-0c1d2e3f4a5b' },
          title: { type: 'string', example: 'Historic Town Square Acoustic Tour' },
          description: {
            type: 'string',
            example: 'Field recording capturing the central bell tower chime.',
          },
          latitude: { type: 'number', example: 37.7749 },
          longitude: { type: 'number', example: -122.4194 },
          distanceMeters: { type: 'number', example: 342.5 },
          durationSeconds: { type: 'number', nullable: true, example: 124.5 },
          mimeType: { type: 'string', example: 'audio/mpeg' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-10T10:00:00.000Z' },
          owner: { $ref: '#/components/schemas/AudioOwnerPublicInfo' },
        },
        required: [
          'id',
          'title',
          'description',
          'latitude',
          'longitude',
          'distanceMeters',
          'mimeType',
          'createdAt',
          'owner',
        ],
      },
      CreateAudioRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100, example: 'Golden Gate Foghorn' },
          description: {
            type: 'string',
            maxLength: 500,
            example: 'Early morning atmospheric marine layer audio.',
          },
          latitude: { type: 'number', minimum: -90, maximum: 90, example: 37.8199 },
          longitude: { type: 'number', minimum: -180, maximum: 180, example: -122.4783 },
          visibility: {
            type: 'string',
            enum: ['public', 'private', 'unlisted'],
            default: 'public',
          },
          declaredMimeType: {
            type: 'string',
            enum: [
              'audio/mpeg',
              'audio/mp3',
              'audio/wav',
              'audio/wave',
              'audio/x-wav',
              'audio/aac',
              'audio/ogg',
              'audio/webm',
              'audio/flac',
              'audio/m4a',
              'audio/x-m4a',
              'audio/mp4',
            ],
            example: 'audio/mpeg',
          },
          declaredSizeBytes: {
            type: 'integer',
            minimum: 1,
            maximum: env.MAX_AUDIO_FILE_SIZE_BYTES,
            example: 5242880,
          },
        },
        required: ['title', 'latitude', 'longitude', 'declaredMimeType', 'declaredSizeBytes'],
      },
      UpdateAudioRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100, example: 'Updated Title' },
          description: { type: 'string', maxLength: 500, example: 'Updated description of audio' },
          visibility: { type: 'string', enum: ['public', 'private', 'unlisted'] },
          latitude: { type: 'number', minimum: -90, maximum: 90, example: 37.7749 },
          longitude: { type: 'number', minimum: -180, maximum: 180, example: -122.4194 },
        },
      },
      UploadSessionResponse: {
        type: 'object',
        properties: {
          audioId: {
            type: 'string',
            format: 'uuid',
            example: '8f3e1a2b-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
          },
          storagePath: { type: 'string', example: 'audio/user123/8f3e1a2b.mp3' },
          uploadUrl: {
            type: 'string',
            example:
              'https://storage.googleapis.com/proxispeak-dev.appspot.com/audio/...?X-Goog-Signature=...',
          },
          uploadMethod: { type: 'string', example: 'PUT' },
          requiredHeaders: {
            type: 'object',
            properties: {
              'Content-Type': { type: 'string', example: 'audio/mpeg' },
            },
          },
          expiresAt: { type: 'string', format: 'date-time', example: '2026-10-10T10:15:00.000Z' },
        },
        required: [
          'audioId',
          'storagePath',
          'uploadUrl',
          'uploadMethod',
          'requiredHeaders',
          'expiresAt',
        ],
      },
      PlaybackResponse: {
        type: 'object',
        properties: {
          playbackUrl: {
            type: 'string',
            example:
              'https://storage.googleapis.com/proxispeak-dev.appspot.com/audio/...?X-Goog-Signature=...',
          },
          mimeType: { type: 'string', example: 'audio/mpeg' },
          sizeBytes: { type: 'integer', example: 5242880 },
          durationSeconds: { type: 'number', nullable: true, example: 120 },
          expiresAt: { type: 'string', format: 'date-time', example: '2026-10-10T10:15:00.000Z' },
        },
        required: ['playbackUrl', 'mimeType', 'sizeBytes', 'expiresAt'],
      },
    },
  },
  paths: {
    '/api/v1/health': {
      get: {
        summary: 'Application Health & Dependency Status',
        description:
          'Returns server operational health, uptime, and safe Firebase configuration metadata.',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Application is operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        timestamp: { type: 'string', format: 'date-time' },
                        uptimeSeconds: { type: 'integer', example: 120 },
                        environment: { type: 'string', example: 'development' },
                        version: { type: 'string', example: '1.0.0' },
                        dependencies: {
                          type: 'object',
                          properties: {
                            firebase: {
                              type: 'object',
                              properties: {
                                initialized: { type: 'boolean', example: true },
                                projectId: { type: 'string', example: 'proxispeak-dev' },
                                storageBucket: {
                                  type: 'string',
                                  example: 'proxispeak-dev.appspot.com',
                                },
                                emulator: { type: 'boolean', example: false },
                              },
                            },
                          },
                        },
                      },
                    },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/users/me': {
      get: {
        summary: 'Get Current Authenticated User Profile',
        description:
          'Retrieves profile information for the authenticated user. Automatically provisions profile record on initial access.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserProfile' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized - Missing or invalid Firebase ID token',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
      patch: {
        summary: 'Update User Profile',
        description:
          'Updates allowed profile fields (e.g., displayName). Protected fields like UID and status cannot be modified.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserProfileRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserProfile' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation Error or unauthorized field modification attempt',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          401: {
            description: 'Unauthorized - Missing or invalid Firebase ID token',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/v1/audio/nearby': {
      get: {
        summary: 'Discover Nearby Audio Recordings',
        description:
          'Performs geospatial range search using geohash bounds, filters candidates by exact Haversine distance, and returns recordings sorted by proximity.',
        tags: ['Geospatial Discovery'],
        parameters: [
          {
            name: 'lat',
            in: 'query',
            required: true,
            description: 'Latitude of center location (-90 to 90)',
            schema: { type: 'number', minimum: -90, maximum: 90, example: 37.7749 },
          },
          {
            name: 'lng',
            in: 'query',
            required: true,
            description: 'Longitude of center location (-180 to 180)',
            schema: { type: 'number', minimum: -180, maximum: 180, example: -122.4194 },
          },
          {
            name: 'radius',
            in: 'query',
            required: false,
            description: `Search radius in meters (Default: ${env.DEFAULT_DISCOVERY_RADIUS_METERS}, Max: ${env.MAX_DISCOVERY_RADIUS_METERS})`,
            schema: {
              type: 'number',
              minimum: 1,
              maximum: env.MAX_DISCOVERY_RADIUS_METERS,
              default: env.DEFAULT_DISCOVERY_RADIUS_METERS,
              example: 5000,
            },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: `Max recordings per page (Default: ${env.DEFAULT_DISCOVERY_PAGE_LIMIT}, Max: ${env.MAX_DISCOVERY_PAGE_LIMIT})`,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: env.MAX_DISCOVERY_PAGE_LIMIT,
              default: env.DEFAULT_DISCOVERY_PAGE_LIMIT,
              example: 20,
            },
          },
          {
            name: 'cursor',
            in: 'query',
            required: false,
            description: 'Opaque base64 pagination cursor returned from a previous search',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Nearby audio recordings found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        results: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/NearbyAudioResult' },
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer', example: 1 },
                            limit: { type: 'integer', example: 20 },
                            nextCursor: { type: 'string', nullable: true, example: null },
                            hasMore: { type: 'boolean', example: false },
                          },
                        },
                      },
                    },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid coordinates, invalid radius, or invalid cursor',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          429: {
            description: 'Rate limit exceeded on discovery search',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/v1/audio': {
      post: {
        summary: 'Initiate Audio Upload Session',
        description:
          'Validates audio metadata, generates server-controlled storage path, creates pending upload record, and returns a time-limited signed upload URL for Cloud Storage.',
        tags: ['Audio Management'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAudioRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Upload session created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UploadSessionResponse' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation failed or unsupported audio MIME type',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          401: {
            description: 'Unauthorized - Missing or invalid Firebase ID token',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          413: {
            description: 'Declared file size exceeds maximum limit',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/v1/audio/{id}/complete': {
      post: {
        summary: 'Finalize & Publish Audio Upload',
        description:
          'Verifies the uploaded file in Cloud Storage, validates size and MIME type, and transitions status to published. Idempotent.',
        tags: ['Audio Management'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID of the audio recording to complete',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Audio recording verified and published',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AudioRecording' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            description: 'File not found in storage or recording not in pending_upload state',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          403: {
            description: 'Forbidden - User does not own this recording',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          404: {
            description: 'Audio recording not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/v1/audio/{id}': {
      get: {
        summary: 'Get Audio Recording Metadata',
        description:
          'Retrieves metadata for an audio recording. Public recordings are viewable by anyone; private recordings require owner authentication.',
        tags: ['Audio Management'],
        security: [{ bearerAuth: [] }, {}],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID of the audio recording',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Audio metadata retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AudioRecording' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          403: {
            description: 'Forbidden - Private recording access denied',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          404: {
            description: 'Audio recording not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
      patch: {
        summary: 'Update Audio Metadata',
        description:
          'Updates mutable fields (title, description, visibility, coordinates). Recalculates geohash if coordinates change. Restricted to owner.',
        tags: ['Audio Management'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID of the audio recording',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAudioRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Audio metadata updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AudioRecording' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          403: {
            description: 'Forbidden - User is not the owner',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          404: {
            description: 'Audio recording not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
      delete: {
        summary: 'Delete Audio Recording',
        description:
          'Deletes audio metadata from Firestore and associated audio file from Cloud Storage. Restricted to owner.',
        tags: ['Audio Management'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID of the audio recording',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Audio recording deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          example: 'Audio recording deleted successfully',
                        },
                      },
                    },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          403: {
            description: 'Forbidden - User is not the owner',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          404: {
            description: 'Audio recording not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/v1/audio/{id}/playback': {
      get: {
        summary: 'Generate Playback URL',
        description:
          'Generates a secure, time-limited signed URL for streaming or downloading audio. Public recordings can be played by anyone; private recordings require owner authentication.',
        tags: ['Audio Management'],
        security: [{ bearerAuth: [] }, {}],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID of the audio recording',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Signed playback URL generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PlaybackResponse' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Audio is not in published status',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          403: {
            description: 'Forbidden - Recording is private and user is not owner',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          404: {
            description: 'Audio recording not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
  },
};

# ==========================================
# Multi-stage Production Dockerfile
# ==========================================

# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies needed for build
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source code and build TypeScript bundle
COPY src ./src
RUN npm run build

# Stage 2: Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5000

# Install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript from builder
COPY --from=builder /usr/src/app/dist ./dist

# Create unprivileged application user
USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]

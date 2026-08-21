# Multi-stage build for Node.js backend
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm ci

# Copy TypeScript source
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma

# Build TypeScript
WORKDIR /app/packages/backend
RUN npm run build

# Stage 2: Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files from builder
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/node_modules ./packages/backend/node_modules

# Copy .env.example for reference
COPY packages/backend/.env.example ./packages/backend/

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "packages/backend/dist/app.js"]

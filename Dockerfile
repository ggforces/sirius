# Use official Node.js LTS (Long Term Support) image
FROM node:20-alpine

# Install build tools for native modules (better-sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++ sqlite-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install to avoid Windows-Linux lockfile conflicts)
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create directory for database
RUN mkdir -p /app/data

# Set environment variable for database path
ENV DB_PATH=/app/data/database.sqlite

# Expose port
EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5050/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]

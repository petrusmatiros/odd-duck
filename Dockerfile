FROM node:20-alpine

WORKDIR /app

# Copy and install frontend dependencies (including dev for build)
COPY client/package*.json ./client/
RUN npm ci --prefix client

# Copy and install backend dependencies (production only)
COPY server/package*.json ./server/
RUN npm ci --prefix server --omit=dev

# Copy source code
COPY client/ ./client/
COPY server/ ./server/

# Build frontend inside container
RUN npm run build --prefix client

# Copy frontend build output to backend public directory
RUN rm -rf server/public && mkdir -p server/public
RUN cp -r client/dist/* server/public/

# Expose backend port
EXPOSE 8080

# Start backend server
CMD ["npm", "start", "--prefix", "server"]

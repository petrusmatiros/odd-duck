FROM node:20-alpine

WORKDIR /app

# Copy and install frontend dependencies (including dev for build)
COPY client/package*.json ./client/
RUN npm ci --prefix client

# Copy and install backend dependencies (production only)
COPY server/package*.json ./server/
RUN npm ci --prefix server

ARG VITE_WS_SERVER_URL
ARG VITE_WS_NEW_PLAYER_NAMESPACE
ARG VITE_WS_VALIDATED_NAMESPACE

# Copy source code
COPY client/ ./client/
COPY server/ ./server/

# Inject env vars to build process
RUN VITE_WS_SERVER_URL=$VITE_WS_SERVER_URL \
    VITE_WS_NEW_PLAYER_NAMESPACE=$VITE_WS_NEW_PLAYER_NAMESPACE \
    VITE_WS_VALIDATED_NAMESPACE=$VITE_WS_VALIDATED_NAMESPACE \
    npm run build --prefix client

# Copy frontend build output to backend public directory
RUN rm -rf server/public && mkdir -p server/public
RUN cp -r client/dist/* server/public/

# Expose backend port
EXPOSE 8080

# Start backend server
CMD ["npm", "start", "--prefix", "server"]

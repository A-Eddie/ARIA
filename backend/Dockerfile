# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Non-root user for security
RUN addgroup -S aria && adduser -S aria -G aria
USER aria

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]

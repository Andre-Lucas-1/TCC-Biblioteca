# syntax=docker/dockerfile:1

# Build stage: install deps (including native builds if needed)
FROM node:18-slim AS build
WORKDIR /app

# Install build tools for native modules when needed
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 g++ make && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Runtime stage: copy only built app
FROM node:18-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app /app

EXPOSE 3000
CMD ["npm", "start"]
# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Create uploads directory for local file storage
RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "dist/main"]

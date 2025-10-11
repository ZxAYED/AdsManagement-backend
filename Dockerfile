# -------------------------
# 1️⃣ Build Stage
# -------------------------
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependencies & prisma schema first
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy rest of the code
COPY . .

# Build the app (NestJS)
RUN npm run build


# -------------------------
# 2️⃣ Production Stage
# -------------------------
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Copy only package.json first
COPY package*.json ./
# Copy prisma folder for prisma generate
COPY prisma ./prisma

# Install production dependencies
RUN npm ci --omit=dev

# Copy built code from builder
COPY --from=builder /usr/src/app/dist ./dist

# Copy .env if needed
# COPY .env .env

EXPOSE 3000

CMD ["npm", "run", "start:prod"]

FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies (including dev) for building
COPY package*.json ./
RUN npm ci

# Copy the rest of the build context required for compilation
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Produce the compiled JavaScript output
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# pm2 is used to run the app inside Docker
RUN npm install -g pm2

# Install only production dependencies for a slimmer image
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the build artifacts and pm2 ecosystem config
COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js ./ecosystem.config.js

EXPOSE 3000

# Use pm2-runtime which is tailored for Docker
CMD ["pm2-runtime", "ecosystem.config.js"]

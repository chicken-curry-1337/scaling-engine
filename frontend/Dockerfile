FROM node:16-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:latest AS runner
WORKDIR /usr/share/nginx/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends certbot \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/www/certbot

COPY nginx/docker-entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh
COPY --from=builder /app/build .

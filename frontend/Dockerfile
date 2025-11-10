FROM node:16-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:latest AS runner
WORKDIR /usr/share/nginx/html

COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build .

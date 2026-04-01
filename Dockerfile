FROM node:lts-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
COPY .env .env

RUN npm run build

FROM node:lts-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/.env /app/.env

CMD ["node", ".output/server/index.mjs"]

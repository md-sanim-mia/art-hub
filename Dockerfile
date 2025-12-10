
FROM node:20-alpine AS builder

ARG DATABASE_URL

WORKDIR /app

COPY package*.json ./

COPY prisma ./prisma/

RUN npm ci

COPY . .

ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app


COPY package*.json ./


COPY --chown=nodejs:nodejs prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force


COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist


RUN mkdir -p uploads && chown nodejs:nodejs uploads
RUN npx prisma generate


USER nodejs


EXPOSE 5000


ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/server.js"]
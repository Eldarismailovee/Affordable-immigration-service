FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-dejavu-core \
  fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

RUN mkdir -p /app/uploads

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]

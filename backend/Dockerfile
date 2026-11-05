FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY server.js ./
EXPOSE 3000
CMD ["node", "--watch", "--watch-path=/app/dev", "/app/dev/server.js"]

FROM node:20-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js ./

EXPOSE 3000
CMD ["npm", "start"]

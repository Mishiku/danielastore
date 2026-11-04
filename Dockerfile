FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4200
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--poll", "1000"]

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
ENV NGINX_PORT=8080 \
    BACKEND_HOST=127.0.0.1 \
    BACKEND_PORT=3000 \
    PORT=3000
WORKDIR /app
RUN apk add --no-cache nginx
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY backend/server.js ./backend/server.js
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/aurum-and-co/browser /usr/share/nginx/html
EXPOSE 8080 3000
CMD ["sh", "-c", "node /app/backend/server.js & nginx -g 'daemon off;'"]

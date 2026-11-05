FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080", "--poll", "1000"]

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS production
ENV NGINX_PORT=8080 \
    BACKEND_HOST=localhost/api \
    BACKEND_PORT=3000
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/danielastore/browser /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]


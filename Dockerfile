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

FROM nginx:alpine
ENV NGINX_PORT=80 \
    BACKEND_HOST=backend \
    BACKEND_PORT=3000
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/aurum-and-co/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

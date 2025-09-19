# ---- Base Stage ----
FROM node:22-bookworm AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build Stage ----
FROM base AS build
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM nginx:latest AS production
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]

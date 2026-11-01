# Stage 1: Build the React Application
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
# Use --legacy-peer-deps to avoid issues with lucide-react etc.
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Set default env variable (can be overridden at runtime but needed for build if static)
ENV VITE_API_URL=/api

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist /usr/share/nginx/html

# Add a custom nginx configuration to support React Router (SPA)
# We will create this default.conf file next or just use a simple bash command to inject it
RUN echo 'server { \
    listen 80; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

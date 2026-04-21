FROM node:18-alpine

WORKDIR /app

# Install nodemon globally for hot-reload in development
RUN npm install -g nodemon

# Install dependencies first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5000

CMD ["nodemon", "server.js"]

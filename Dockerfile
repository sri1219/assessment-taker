# Use Node.js base image
FROM node:18-slim

# Install Java JDK (Required for compiling Java code)
RUN apt-get update && \
    apt-get install -y default-jdk && \
    apt-get clean

# Create app directory
WORKDIR /app

# Copy backend files
COPY backend/ ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install

# Expose the port
EXPOSE 5000

# Start the server (Production)
CMD ["node", "server.js"]

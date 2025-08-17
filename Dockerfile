# Stage 1: Build the Node.js application
FROM node:18-slim AS builder

WORKDIR /usr/src/app/mcp-selenium

# Copy package files and install dependencies
COPY mcp-selenium/package*.json ./
RUN npm install

# Copy the rest of the mcp-selenium source code
COPY mcp-selenium/ ./

# Stage 2: Create the final, optimized image
# Use the full Debian Bullseye image to ensure all system libraries are available
FROM python:3.9-bullseye

# Install a modern version of Node.js (v18), Firefox, its dependencies, Xvfb, and xauth
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    firefox-esr \
    xvfb \
    xauth \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy the pre-built Node.js app from the builder stage
COPY --from=builder /usr/src/app/mcp-selenium ./mcp-selenium

# Copy the langchain-agent source code
COPY langchain-agent/ ./langchain-agent

# Install Python dependencies
RUN pip install --no-cache-dir -r langchain-agent/requirements.txt

# Copy the startup script and make it executable
COPY start.sh .
RUN chmod +x start.sh

# Expose the required ports
EXPOSE 3000 8501

# Set the command to run the application
CMD ["./start.sh"]

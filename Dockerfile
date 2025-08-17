# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install Node.js
RUN apt-get update && apt-get install -y nodejs npm

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r langchain-agent/requirements.txt

# Install Node.js dependencies
RUN cd mcp-selenium && npm install

# Make the startup script executable
RUN chmod +x start.sh

# Expose ports
EXPOSE 3000 8501

# Run the startup script
CMD ["./start.sh"]

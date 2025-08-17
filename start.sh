#!/bin/sh
# Exit immediately if a command exits with a non-zero status.
set -e

# Start the Node.js server in the background, inside a virtual display
echo "Starting Node.js server with Xvfb..."
(xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" node /usr/src/app/mcp-selenium/http-server.js) &

# Start the Streamlit app in the foreground
echo "Starting Streamlit application..."
streamlit run /usr/src/app/langchain-agent/app.py --server.port 8501 --server.address 0.0.0.0 --server.enableCORS=false --server.enableXsrfProtection=false

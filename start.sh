#!/bin/sh
# Start the Node.js server in the background
cd /usr/src/app/mcp-selenium && node http-server.js &

# Start the Streamlit app in the foreground
# We use --server.enableCORS=false to allow the agent to communicate with the server
streamlit run langchain-agent/app.py --server.port 8501 --server.address 0.0.0.0 --server.enableCORS=false

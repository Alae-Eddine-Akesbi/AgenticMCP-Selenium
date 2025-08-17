# 🤖 AI-Powered Browser Automation with LangChain and Selenium MCP

This project provides a powerful and flexible solution for automating web browsers using natural language commands. It combines a **LangChain agent** with a **Selenium-based MCP server** to create a system that can perform complex web automation tasks based on simple, conversational instructions. The project is designed for seamless integration with **n8n**, allowing you to build sophisticated automation workflows with ease.

## ✨ Key Features

*   **Natural Language Control**: Use simple, conversational language to control a web browser.
*   **Modular Architecture**: The LangChain agent and Selenium MCP server are decoupled, making the system easy to maintain and extend.
*   **Seamless n8n Integration**: Comes with a pre-built n8n workflow for rapid setup and deployment.
*   **Comprehensive Toolset**: A rich set of browser automation tools for handling a wide range of tasks.
*   **Session Persistence**: Browser sessions are maintained across server restarts, allowing for long-running, stateful automations.

## 🏛️ Project Architecture

The project consists of two main components:

1.  **`langchain-agent`**: A Python application built with LangChain and Streamlit that provides a chat-based interface for the user. It uses a powerful language model (like Google's Gemini) to interpret user commands and orchestrate the automation tasks.

2.  **`mcp-selenium`**: A Node.js server that implements the Model Context Protocol (MCP). It acts as a bridge between the LangChain agent and Selenium WebDriver, exposing a set of tools that the agent can use to control a web browser.

The two components communicate over HTTP, with the LangChain agent sending commands to the MCP server, which then executes them in the browser.

## 🚀 Getting Started

### Prerequisites

*   Node.js and npm
*   Python and pip
*   An API key for a supported language model (e.g., Google Gemini)

### 1. Set Up the `mcp-selenium` Server

The `mcp-selenium` server is the engine of the project, responsible for executing the browser automation tasks.

**Installation:**

```bash
cd mcp-selenium
npm install
```

**Running the Server:**

```bash
node http-server.js
```

The server will start on `http://localhost:3000`.

### 2. Set Up the `langchain-agent`

The `langchain-agent` provides the user interface and the "brains" of the operation.

**Installation:**

```bash
cd langchain-agent
pip install -r requirements.txt
```

**Configuration:**

Create a `.env` file in the `langchain-agent` directory and add your language model's API key:

```
GEMINI_API_KEY=your_api_key_here
```

**Running the Agent:**

```bash
streamlit run app.py
```

This will launch a web-based chat interface where you can interact with the agent.

## 🐳 Docker Usage

This project is also available as a Docker image, which simplifies the setup process by bundling the `langchain-agent` and `mcp-selenium` server into a single container.

**Building the Docker Image:**

```bash
docker build -t mcp-selenium-agent .
```

**Running the Docker Container:**

```bash
docker run -p 3000:3000 -p 8501:8501 mcp-selenium-agent
```

This will start both the `mcp-selenium` server on port `3000` and the `langchain-agent` on port `8501`. You can access the agent's web interface by navigating to `http://localhost:8501` in your browser.

## 🔗 n8n Integration

This project is designed to be used with n8n, a powerful workflow automation tool. We've provided a pre-built workflow (`selenium_workflow.json`) to get you started quickly.

**Setting Up the Workflow:**

1.  Import the `selenium_workflow.json` file into your n8n instance.
2.  Configure the **Google Gemini Chat Model** node with your API credentials.
3.  Ensure the **MCP Client** node is pointing to the correct URL for your `mcp-selenium` server (`http://127.0.0.1:3000` by default).
4.  Activate the workflow.

You can now interact with the agent directly from the n8n chat interface.

## 🧰 Available Tools

The `mcp-selenium` server provides a comprehensive set of tools for browser automation. Here's a complete list:

### Browser Management

*   **`start_browser`**: Launches a new browser session.
*   **`navigate`**: Navigates to a specific URL.
*   **`close_session`**: Closes the current browser session.

### Page Interaction

*   **`get_page_source`**: Retrieves the HTML source of the current page.
*   **`get_element_text`**: Gets the visible text of a specific element.
*   **`take_screenshot`**: Takes a screenshot of the visible part of the page.

### Element Interaction

*   **`find_element`**: Checks if an element exists on the page.
*   **`click_element`**: Clicks on a specific element.
*   **`send_keys`**: Types text into an input field.
*   **`upload_file`**: Uploads a file to a file input field.

### Advanced Interactions

*   **`hover`**: Hovers the mouse over an element.
*   **`drag_and_drop`**: Drags an element and drops it onto another.
*   **`double_click`**: Performs a double-click on an element.
*   **`right_click`**: Performs a right-click on an element.
*   **`press_key`**: Simulates pressing a key on the keyboard.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

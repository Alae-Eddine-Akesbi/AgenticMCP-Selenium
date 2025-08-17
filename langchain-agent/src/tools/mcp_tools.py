import requests
from langchain.tools import BaseTool
import yaml
import os

# Construct the path to config.yaml relative to this file
config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config.yaml')

with open(config_path, "r") as f:
    config = yaml.safe_load(f)

MCP_SERVER_URL = config["mcp_server"]["url"]

class MCPTool(BaseTool):
    name: str
    description: str

    def _run(self, *args, **kwargs):
        import asyncio
        return asyncio.run(self._arun(*args, **kwargs))

    async def _arun(self, *args, **kwargs):
        tool_name = self.name
        
        # The agent sometimes passes a string, sometimes a dict.
        # We handle both cases here.
        arguments = {}
        if args:
            if isinstance(args[0], str):
                import json
                try:
                    arguments = json.loads(args[0])
                except json.JSONDecodeError:
                    # It's not a JSON string, so we can't parse it.
                    # This is likely a tool that takes a single string argument.
                    # The navigate tool is a good example of this.
                    if self.name == 'navigate':
                        arguments = {'url': args[0]}
                    else:
                        # We don't know how to handle this.
                        # We'll just pass an empty dict.
                        pass
            elif isinstance(args[0], dict):
                arguments = args[0]

        if kwargs:
            arguments.update(kwargs)

        payload = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            },
            "id": 1
        }
        try:
            response = requests.post(MCP_SERVER_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            if "error" in result:
                return f"Error from MCP server: {result['error']['message']}"
            return result["result"]["content"][0]["text"]
        except requests.exceptions.RequestException as e:
            return f"Error connecting to MCP server: {e}"

def get_mcp_tools():
    try:
        response = requests.get(f"{MCP_SERVER_URL}/tools")
        response.raise_for_status()
        tools_data = response.json()["tools"]
        
        tools = []
        for tool_data in tools_data:
            tool = MCPTool(
                name=tool_data["name"],
                description=tool_data["description"]
            )
            tools.append(tool)
        return tools
    except requests.exceptions.RequestException as e:
        print(f"Error fetching tools from MCP server: {e}")
        return []

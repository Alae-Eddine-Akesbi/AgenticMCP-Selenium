import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain.memory import ConversationBufferMemory
from src.tools.mcp_tools import get_mcp_tools
from src.prompts.prompt import prompt
import yaml
import os
from dotenv import load_dotenv

load_dotenv()

# Construct the path to config.yaml relative to this file
config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config.yaml')

with open(config_path, "r") as f:
    config = yaml.safe_load(f)

def create_agent_executor():
    llm = ChatGoogleGenerativeAI(
        model=config["model"]["name"],
        google_api_key=os.getenv("GEMINI_API_KEY")
    )
    
    tools = get_mcp_tools()
    
    memory = ConversationBufferMemory(memory_key="chat_history")
    
    agent = create_react_agent(llm, tools, prompt)
    
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=50,
        max_execution_time=900
    )
    
    return agent_executor

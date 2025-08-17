import streamlit as st
from src.agent.executor import create_agent_executor

st.set_page_config(page_title="MCP Selenium Agent", page_icon="🤖")

st.title("🤖 MCP Selenium Agent")

# Custom CSS for styling
st.markdown("""
<style>
    .stApp {
        background-color: #f0f2f6;
    }
    .stTextInput > div > div > input {
        background-color: #ffffff;
    }
    .stButton > button {
        background-color: #4CAF50;
        color: white;
    }
</style>
""", unsafe_allow_html=True)

if "agent_executor" not in st.session_state:
    st.session_state.agent_executor = create_agent_executor()

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("What would you like to do?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            response = st.session_state.agent_executor.invoke({
                "input": prompt,
                "chat_history": st.session_state.messages
            })
            st.markdown(response["output"])
            st.session_state.messages.append({"role": "assistant", "content": response["output"]})

import streamlit as st
import httpx
import sys
import os
from pathlib import Path

# --- AUTO-PATH FIX ---
# This line finds the 'streamlit_demo' folder and tells Python it's a source for modules
root_path = str(Path(__file__).parent.parent)
if root_path not in sys.path:
    sys.path.append(root_path)

API_BASE = "http://localhost:8000"

def get_auth_header():
    token = st.session_state.get('auth_token')
    return {"Authorization": f"Bearer {token}"} if token else {}

def api_call(method: str, endpoint: str, **kwargs):
    """
    Unified API caller that handles JSON and File uploads.
    Automatically injects the Auth token.
    """
    endpoint = endpoint.lstrip("/")
    url = f"{API_BASE}/{endpoint}"
    
    if "headers" not in kwargs:
        kwargs["headers"] = get_auth_header()
    
    timeout = kwargs.pop("timeout", 30)
    
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.request(method, url, **kwargs)
            return response
    except Exception as e:
        st.error(f"📡 Backend Connection Error: {e}")
        return None
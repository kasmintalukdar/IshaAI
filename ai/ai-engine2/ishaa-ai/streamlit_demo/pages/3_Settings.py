# ==============================================================
# FILE: streamlit_demo/pages/3_Settings.py
# ==============================================================
import streamlit as st
import sys
from pathlib import Path

# --- SAFE IMPORT (Path Fix) ---
root = str(Path(__file__).parent.parent)
if root not in sys.path:
    sys.path.append(root)

try:
    from utils.api_client import api_call
except ImportError:
    st.error("❌ Could not find 'utils'. Make sure __init__.py exists in the utils folder.")
    st.stop()

# ── 1. GATEKEEPER ──
if not st.session_state.get('auth_token'):
    st.info("🔒 Please login to manage your keys and preferences.")
    st.stop()

st.title("⚙️ Settings")
st.caption("Manage your API key, plan, and account preferences")

# ── 2. USAGE & PLAN ──
st.subheader("📊 Your Plan & Today's Usage")

usage_resp = api_call("GET", "/ai-help/usage")
if usage_resp and usage_resp.status_code == 200:
    usage_data = usage_resp.json()
    
    st.write(f"**Current Plan:** `{usage_data.get('plan', 'free').upper()}`")
    st.caption(f"Quotas reset at: {usage_data.get('reset_at', 'Midnight UTC')}")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        chats = usage_data.get("ai_chats", {})
        st.metric("AI Chats", f"{chats.get('used', 0)} / {chats.get('limit', '∞')}")
    with col2:
        vision = usage_data.get("vision_audits", {})
        st.metric("Vision Audits", f"{vision.get('used', 0)} / {vision.get('limit', '∞')}")
    with col3:
        hints = usage_data.get("hints", {})
        st.metric("Hints Used", f"{hints.get('used', 0)} / {hints.get('limit', '∞')}")
else:
    st.warning("Could not load current usage data.")

st.divider()

# ── 3. API KEY MANAGEMENT ──
st.subheader("🔑 Personal AI Keys")
st.write("Bring your own key to bypass daily platform limits. Keys are AES-256 encrypted.")

gemini_key = st.text_input("Google Gemini API Key", type="password", placeholder="Starts with AIza...")

if st.button("Save & Encrypt Key"):
    if not gemini_key.strip():
        st.error("Please enter a valid key.")
    elif not gemini_key.startswith("AIza"):
        st.error("Invalid format. Gemini keys must start with 'AIza'.")
    else:
        with st.spinner("Encrypting and saving..."):
            res = api_call("POST", "/ai-help/settings/api-key", json={"api_key": gemini_key.strip()})
            if res and res.status_code == 200:
                st.success("✅ Key stored securely!")
            else:
                detail = res.json().get('detail', 'Unknown error') if res else 'Connection error'
                st.error(f"Failed to save: {detail}")

st.divider()

# ── 4. SYSTEM HEALTH ──
st.subheader("🌐 System Status")
health_resp = api_call("GET", "/health/ready", timeout=3)

if health_resp and health_resp.status_code == 200:
    health_data = health_resp.json()
    st.success(f"Backend is Online (v{health_data.get('version', '1.0')})")
    
    col_m, col_r = st.columns(2)
    with col_m:
        st.write(f"MongoDB: {'✅' if health_data.get('mongodb', {}).get('status') == 'ok' else '❌'}")
    with col_r:
        st.write(f"Redis: {'✅' if health_data.get('redis', {}).get('status') == 'ok' else '❌'}")
else:
    st.error("Backend health checks failing or unreachable.")
import streamlit as st
import sys
from pathlib import Path

# --- SAFE IMPORT ---
# This ensures that 'utils' is visible even from the 'pages/' directory
root = str(Path(__file__).parent.parent)
if root not in sys.path:
    sys.path.append(root)

try:
    from utils.api_client import api_call
except ImportError:
    st.error("❌ Critical Error: Could not find 'utils' folder. Please ensure 'streamlit_demo/utils/__init__.py' exists.")
    st.stop()

# ── 1. GATEKEEPER ──
if not st.session_state.get('auth_token'):
    st.warning("🔒 Please login on the Home page to access the Workspace.")
    st.stop()

if "messages" not in st.session_state:
    st.session_state.messages = []

st.title("📚 AI Help Workspace")
st.caption("Socratic tutoring — discover the answer, don't just receive it")

# ── 2. LAYOUT ──
col_main, col_sidebar = st.columns([3, 1])

with col_main:
    st.subheader("Question")
    st.info("📌 Topic: Electric Dipole | Chapter: Electrostatics")
    st.markdown("> **A short electric dipole of dipole moment p is placed at the origin...**")

    # Action Buttons
    btn_col1, btn_col2, btn_col3 = st.columns(3)
    
    with btn_col1:
        if st.button("💡 Get a Hint", use_container_width=True):
            res = api_call("POST", "/ai-help/hint", json={"question_id": "q123", "layer": 1})
            if res and res.status_code == 200:
                st.session_state.messages.append({"role": "assistant", "content": f"💡 **Hint:** {res.json()['hint']}"})
                st.rerun()

    with btn_col2:
        # FIXED: Correct popover context manager usage
        with st.popover("📷 Audit My Work", use_container_width=True):
            st.write("Upload your steps for AI review.")
            img = st.file_uploader("Upload Image", type=['jpg', 'jpeg', 'png'])
            if img and st.button("Submit Photo"):
                files = {"file": (img.name, img.getvalue(), img.type)}
                res = api_call("POST", "/ai-help/vision", files=files, data={"question_id": "q123"})
                if res and res.status_code == 200:
                    st.session_state.messages.append({"role": "assistant", "content": f"🔍 **Vision Audit:** {res.json()['feedback']}"})
                    st.rerun()

    with btn_col3:
        if st.button("🗑️ Clear Chat", use_container_width=True):
            st.session_state.messages = []
            st.rerun()

# ── 3. CHAT INTERFACE ──
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("How do I start calculating the field?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        res = api_call("POST", "/ai-help/chat", json={
            "question_id": "q123", "message": prompt, "history": st.session_state.messages[:-1]
        })
        if res and res.status_code == 200:
            ans = res.json()["response"]
            st.markdown(ans)
            st.session_state.messages.append({"role": "assistant", "content": ans})

# ── 4. SIDEBAR USAGE ──
with st.sidebar:
    st.header("📊 Usage")
    u_res = api_call("GET", "/ai-help/usage")
    if u_res and u_res.status_code == 200:
        usage = u_res.json()
        for key, label in [("ai_chats", "💬 Chats"), ("vision_audits", "📷 Vision"), ("hints", "💡 Hints")]:
            slot = usage.get(key, {})
            st.write(f"**{label}**")
            st.progress(min(slot.get('used', 0) / (slot.get('limit') or 1), 1.0))
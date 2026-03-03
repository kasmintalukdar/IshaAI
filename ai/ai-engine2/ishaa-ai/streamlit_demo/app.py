import streamlit as st
# FIX: `requests` is not in requirements.txt — httpx is. Replaced entirely.
import httpx

st.set_page_config(page_title="ishaa.ai", page_icon="🧠", layout="wide")

API_URL = "http://localhost:8000"

if "auth_token" not in st.session_state:
    st.session_state.auth_token = None
if "user_email" not in st.session_state:
    st.session_state.user_email = None

st.sidebar.title("🧠 ishaa.ai")

if not st.session_state.auth_token:
    auth_mode = st.sidebar.radio("Account Access", ["Login", "Sign Up"])

    if auth_mode == "Sign Up":
        name     = st.sidebar.text_input("Full Name")
        stream   = st.sidebar.selectbox("Stream", ["Science", "Arts", "Commerce"])
        email    = st.sidebar.text_input("Email")
        password = st.sidebar.text_input("Password", type="password")

        if st.sidebar.button("Register"):
            if len(password) < 6:
                st.sidebar.warning("Password must be 6+ characters.")
            else:
                payload = {"name": name, "email": email, "password": password, "stream": stream}
                # FIX: Added try/except — original had none; crashes the whole app if
                # the backend is unreachable (ConnectionError would propagate to Streamlit).
                try:
                    res = httpx.post(f"{API_URL}/auth/register", json=payload, timeout=10)
                    if res.status_code in [200, 201]:
                        st.sidebar.success("Registered! Please log in.")
                    else:
                        try:
                            msg = res.json().get("detail", "Error")
                        except Exception:
                            msg = f"Server Error {res.status_code}"
                        st.sidebar.error(f"Failed: {msg}")
                except httpx.ConnectError:
                    st.sidebar.error("Cannot reach the server. Is the backend running?")
                except Exception as e:
                    st.sidebar.error(f"Connection failed: {e}")
    else:
        email    = st.sidebar.text_input("Email")
        password = st.sidebar.text_input("Password", type="password")

        if st.sidebar.button("Login"):
            # FIX: Original had NO try/except on login — an unreachable backend would
            # raise an unhandled httpx.ConnectError and crash the entire Streamlit app.
            try:
                res = httpx.post(
                    f"{API_URL}/auth/login",
                    json={"email": email, "password": password},
                    timeout=10,
                )
                if res.status_code == 200:
                    st.session_state.auth_token = res.json()["access_token"]
                    st.session_state.user_email = email
                    st.rerun()
                else:
                    st.sidebar.error("Invalid credentials.")
            except httpx.ConnectError:
                st.sidebar.error("Cannot reach the server. Is the backend running?")
            except Exception as e:
                st.sidebar.error(f"Login failed: {e}")
else:
    st.sidebar.success(f"Logged in: {st.session_state.user_email}")
    if st.sidebar.button("Logout"):
        st.session_state.auth_token = None
        st.rerun()

st.sidebar.divider()
st.sidebar.page_link("pages/1_Question_Workspace.py", label="📚 AI Workspace")
st.sidebar.page_link("pages/2_Progress_Dashboard.py", label="📊 Progress Dashboard")
# FIX: Settings page link was missing from the sidebar entirely.
st.sidebar.page_link("pages/3_Settings.py",           label="⚙️ Settings")

st.title("Welcome to ishaa.ai")
if not st.session_state.auth_token:
    st.warning("Please Login or Sign Up in the sidebar.")
else:
    st.balloons()
    st.success("You are connected! Navigate to the AI Workspace to start.")

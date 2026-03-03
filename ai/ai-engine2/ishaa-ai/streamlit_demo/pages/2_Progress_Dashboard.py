import streamlit as st
import plotly.graph_objects as go
import sys
from pathlib import Path

# --- SAFE IMPORT ---
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
    st.error("🔒 Access Denied. Please login on the Home page.")
    st.stop()

st.title("📊 Learning Dashboard")
st.caption("Your progress across all topics and chapters")

# ── 2. FETCH DATA ──
with st.spinner("Syncing your progress..."):
    resp = api_call("GET", "/progress/summary")
    
    if resp and resp.status_code == 200:
        data = resp.json()
    elif resp and resp.status_code == 401:
        st.error("Session expired. Please re-login on the Home page.")
        st.stop()
    else:
        st.warning("Could not reach backend. Showing offline demo data.")
        data = {
            "gamification": {"total_xp": 1240, "streak": 7},
            "wallet": {"gems": 45},
            "topic_states": [
                {"topic": "Electric Field", "mastery_level": 8.0},
                {"topic": "Gauss Law", "mastery_level": 6.0},
            ],
            "ai_report": {"predicted_percentile": 78, "weakness_summary": "Vector directions"}
        }

# ── 3. METRICS ROW ──
gm = data.get("gamification", {})
wallet = data.get("wallet", {})

c1, c2, c3 = st.columns(3)
c1.metric("Total XP", f"🔥 {gm.get('total_xp', 0)}")
c2.metric("Day Streak", f"📅 {gm.get('streak', 0)}")
c3.metric("Gems", f"💎 {wallet.get('gems', 0)}")

# ── 4. RADAR CHART & INSIGHTS ──
col_chart, col_insights = st.columns([1, 1])

with col_chart:
    st.subheader("🎯 Topic Mastery")
    topics = data.get("topic_states", [])
    if topics:
        categories = [t.get('topic', 'Unknown') for t in topics]
        values = [t.get('mastery_level', 0) for t in topics]

        fig = go.Figure(data=go.Scatterpolar(
            r=values, theta=categories, fill='toself', line_color='#6C5CE7'
        ))
        fig.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[0, 10])),
            showlegend=False, margin=dict(t=20, b=20, l=20, r=20), height=320
        )
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Start solving questions to see your mastery chart!")

with col_insights:
    st.subheader("🤖 AI Insights")
    ai_report = data.get("ai_report", {})
    if ai_report:
        st.info(f"🎯 **Predicted Percentile:** {ai_report.get('predicted_percentile', 'N/A')}th")
        if ai_report.get("weakness_summary"):
            st.warning(f"⚠️ **Focus Area:** {ai_report['weakness_summary']}")

import streamlit as st

def nav_bar():
    st.markdown("""
        <style>
            .nav-container {
                background-color: #0E1117;
                padding: 0.7rem 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 0.5rem;
                margin-bottom: 1.5rem;
            }
            .nav-left, .nav-right {
                display: flex;
                gap: 1rem;
            }
            .nav-link {
                color: white;
                text-decoration: none;
                font-weight: 500;
                font-size: 16px;
                padding: 6px 12px;
                border-radius: 8px;
            }
            .nav-link:hover {
                background-color: #1f2937;
                transition: all 0.3s ease-in-out;
            }
        </style>
        <div class="nav-container">
            <div class="nav-left">
                <a class="nav-link" href="?page=dashboard">Dashboard</a>
                <a class="nav-link" href="?page=video">Video Details</a>
            </div>
            <div class="nav-right">
                <a class="nav-link" href="?page=login">Logout</a>
            </div>
        </div>
    """, unsafe_allow_html=True)

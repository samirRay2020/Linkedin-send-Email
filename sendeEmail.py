#!/usr/bin/env python3
import json
import requests
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Email Settings
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
EMAIL_TO_RAW = os.getenv("EMAIL_TO") or EMAIL_USER
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.strato.de")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))


def fetch_gist():
    """Fetch LinkedIn data from gist"""
    gist_url = "https://gist.githubusercontent.com/samirRay2020/48921ceacc845ba5bcbb5463052e0d5c/raw/linkedin-data.json"
    
    print(f"[📥] Fetching gist data from: {gist_url}")
    try:
        response = requests.get(gist_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Handle different payload shapes
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict) and isinstance(data.get("data"), list):
            items = data["data"]
        elif isinstance(data, dict) and isinstance(data.get("items"), list):
            items = data["items"]
        else:
            items = []
        
        print(f"[✓] Fetched {len(items)} items from gist")
        return items
    except Exception as e:
        print(f"[❌] Failed to fetch gist: {e}")
        return []


def format_email_body(items):
    """Format LinkedIn items into HTML email body"""
    if not items:
        return None
    
    html_body = "<h2>LinkedIn Daily Updates</h2><hr><ul>"
    for item in items:
        author = item.get("author", "Unknown author")
        url = item.get("url", "#")
        html_body += f"<li>• <b>{author}</b><br><a href='{url}'>{url}</a></li>"
    html_body += "</ul>"
    
    return html_body


def send_email(subject, body_html):
    """Send email via Strato SMTP"""
    
    # Validate environment variables
    if not all([EMAIL_USER, EMAIL_PASS, EMAIL_TO_RAW, SMTP_HOST, SMTP_PORT]):
        print("[❌] Missing required environment variables")
        print(f"[DEBUG] EMAIL_USER: {'✓' if EMAIL_USER else '❌'}")
        print(f"[DEBUG] EMAIL_PASS: {'✓' if EMAIL_PASS else '❌'}")
        print(f"[DEBUG] EMAIL_TO: {'✓' if EMAIL_TO_RAW else '❌'}")
        print(f"[DEBUG] SMTP_HOST: {SMTP_HOST}, PORT: {SMTP_PORT}")
        raise Exception("Missing required environment variables")
    
    # Parse recipient list (comma-separated)
    email_to_list = [email.strip() for email in EMAIL_TO_RAW.split(",") if email.strip()]
    
    if not email_to_list:
        print("[❌] No valid email addresses in EMAIL_TO")
        raise Exception("No valid email recipients")
    
    print(f"[📧] Email recipients: {', '.join(email_to_list)}")
    
    # Prepare email message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = ", ".join(email_to_list)
    
    part = MIMEText(body_html, "html")
    msg.attach(part)
    
    # Send email via SMTP_SSL
    try:
        print(f"[📡] Connecting to SMTP: {SMTP_HOST}:{SMTP_PORT}")
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            print("[🔐] Authenticating...")
            server.login(EMAIL_USER, EMAIL_PASS)
            print("[✓] Authentication successful")
            
            print("[📨] Sending email...")
            server.sendmail(EMAIL_USER, email_to_list, msg.as_string())
            print("[✅] Email sent successfully")
    except smtplib.SMTPAuthenticationError as e:
        print(f"[❌] Authentication failed: {e}")
        print("[💡] Check: EMAIL_USER and EMAIL_PASS are correct")
        raise
    except Exception as e:
        print(f"[❌] Failed to send email: {e}")
        raise


def main():
    print("[🚀] LinkedIn Email Sender Started\n")
    
    # Fetch gist data
    items = fetch_gist()
    
    # ✅ If API returned {"data":"NA"} → do nothing
    if items == {"data": "NA"}:
        print("[ℹ️] No data available — exiting")
        return
    
    if not items:
        print("[⚠️] No data to send")
        return
    
    # ✅ Filter for yesterday items only
    yesterday_items = [item for item in items if item.get("isYesterday") is True]
    
    if not yesterday_items:
        print("[⚠️] No 'yesterday' items found — skipping email")
        return
    
    # Format email body
    html_body = format_email_body(yesterday_items)
    
    if not html_body:
        print("[⚠️] Could not format email body")
        return
    
    # Send email
    send_email("📰 LinkedIn Daily Updates", html_body)


if __name__ == "__main__":
    main()

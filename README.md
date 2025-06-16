# Urban Flame

**Urban Flame** is a full-stack restaurant ordering app.

## Tech Stack

- **Backend:** Flask, Flask-JWT-Extended, SQLAlchemy  
- **Database:** SQLite (dev) → PostgreSQL (prod)  
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript  
- **Containerisation:** Docker, Docker Compose  
- **Deployment:** GitHub Actions → VPS (Gunicorn + Nginx)  
- **Realtime:** Flask-SocketIO (kitchen & drivers)  
- **Payments:** Safaricom M-Pesa Daraja STK-Push (future)

## Quick Start

1. Clone the repo  
2. `python -m venv venv`  
3. `venv\Scripts\activate` (Win) or `source venv/bin/activate` (mac/Linux)  
4. `pip install -r requirements.txt`  
5. `flask run`  
6. Visit `http://127.0.0.1:5000`

## Roadmap

See [docs/roadmap.md]() for planned versions (VER 1–12).

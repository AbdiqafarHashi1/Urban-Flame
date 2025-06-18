import os
from datetime import timedelta


class Config:
    # ------------------------------------------------------------------ #
    #  Flask / Security
    # ------------------------------------------------------------------ #
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-please-replace"

    # ------------------------------------------------------------------ #
    #  Database
    # ------------------------------------------------------------------ #
    # Falls back to local SQLite when DATABASE_URL isn’t set
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///urban_flame.db",       # relative file path
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ------------------------------------------------------------------ #
    #  JWT
    # ------------------------------------------------------------------ #
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or "jwt-dev-secret"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    # ------------------------------------------------------------------ #
    #  Anything else (DEBUG, MAIL, etc.) can live here
    # DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

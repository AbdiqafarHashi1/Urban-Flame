import os
from datetime import timedelta

class Config:
    # SECRET_KEY is used by Flask for security purposes (e.g., session management, CSRF protection)
    # It's crucial to set this to a strong, random value and keep it secret in production.
    # We'll load it from an environment variable, or use a default for development.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-dev-secret-key-please-change-in-env'

    # SQLALCHEMY_DATABASE_URI tells SQLAlchemy where your database is located.
    # We're starting with SQLite. The 'sqlite:///../urban_flame.db' path means
    # the database file (urban_flame.db) will be created in the root directory
    # of your backend project (urban_flame_backend), one level above the 'app' directory.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///../urban_flame.db'

    # SQLALCHEMY_TRACK_MODIFICATIONS is set to False to disable a feature of SQLAlchemy
    # that signals the application every time a change is about to be made in the database.
    # This is often unnecessary and can consume extra resources.
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT_SECRET_KEY is used to sign your JSON Web Tokens for authentication.
    # Like SECRET_KEY, this should be a strong, random value and kept secret.
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-dev-jwt-secret-key-please-change-in-env'

    # JWT_ACCESS_TOKEN_EXPIRES sets how long an access token is valid after it's created.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1) # Example: tokens expire in 1 hour

    # Add other configurations as needed, for example:
    # DEBUG = os.environ.get('FLASK_DEBUG') or True # For development
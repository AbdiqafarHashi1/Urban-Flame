from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import Config # Imports the Config class from config.py in the same directory

# Initialize extensions instances globally, but configure them within the app factory
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Import and register blueprints (for routes) here
    from .routes import api_bp # Import the auth_bp from routes.py
    app.register_blueprint(api_bp) # The url_prefix is already defined in the blueprint

    # serve the single-page front-end  -------------------------------------------
    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    # ... (the /hello route and models import at the bottom) ...
    @app.route('/hello')
    def hello():
        return "Hello, Urban Flame Backend is alive!"

    from . import models

    return app
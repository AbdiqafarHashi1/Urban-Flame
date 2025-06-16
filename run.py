from app import create_app # Imports the create_app function from app/__init__.py
from dotenv import load_dotenv # For loading environment variables from .env file
import os

# Load environment variables from the .env file in the project root.
# This allows you to keep sensitive information like secret keys out of your codebase.
load_dotenv()

# Create an instance of the Flask application using the app factory
app = create_app()

if __name__ == '__main__':
    # app.run() starts the Flask development server.
    # debug=True enables debug mode, which provides helpful error messages and
    # automatically reloads the server when you make code changes.
    # IMPORTANT: Never run with debug=True in a production environment!
    app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 5000))
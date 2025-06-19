# Dockerfile
FROM python:3-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Create and switch to non-root user
RUN adduser -u 5678 --disabled-password --gecos "" appuser \
    && chown -R appuser /app
USER appuser

# (Optional) document the port
EXPOSE $PORT

# Runtime: start Gunicorn pointing at your run.py’s `app`, binding to the dynamic PORT
CMD ["sh", "-c", "gunicorn --workers 2 --bind 0.0.0.0:$PORT run:app"]

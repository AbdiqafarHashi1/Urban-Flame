web: alembic -c urban_flame_backend/alembic.ini upgrade head \
     && gunicorn urban_flame_backend.run:app --bind 0.0.0.0:$PORT

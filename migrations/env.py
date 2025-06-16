from __future__ import with_statement
import logging
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from flask import current_app

# this is the Alembic Config object, which provides
# access to the values within your .ini file in use.
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

# --- Import your app and db objects ---
# Adjust these imports to match your project structure.
from app import create_app, db

# Create your Flask app and push an application context,
# so current_app and db are available to Alembic
app = create_app()
app.app_context().push()

# this is the SQLAlchemy MetaData object
# that Alembic needs for autogenerate support:
target_metadata = db.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode (no DBAPI required)."""
    url = current_app.config['SQLALCHEMY_DATABASE_URI']
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,          # detect column type changes
        render_as_batch=True        # for SQLite migrations, if you ever use SQLite
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode (with DBAPI)."""
    # Pull in the SQLALCHEMY settings from alembic.ini
    cfg = config.get_section(config.config_ini_section)
    # Override the URL with the one from our Flask config
    cfg['sqlalchemy.url'] = current_app.config['SQLALCHEMY_DATABASE_URI']

    connectable = engine_from_config(
        cfg,
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,      # detect column type changes
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

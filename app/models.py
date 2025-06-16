from app import db  # Imports the 'db' instance from your app/__init__.py
from werkzeug.security import generate_password_hash, check_password_hash
import json
from datetime import datetime, timezone # Ensure timezone is imported

class User(db.Model):
    __tablename__ = 'users'  # Optional: explicitly names the table in the database

    id = db.Column(db.Integer, primary_key=True) # Primary key for the user
    name = db.Column(db.String(100), nullable=False) # User's full name, cannot be empty
    email = db.Column(db.String(120), unique=True, nullable=False, index=True) # User's email, must be unique and cannot be empty. Indexed for faster lookups.
    password_hash = db.Column(db.String(256), nullable=False) # Stores the hashed version of the user's password

    # Stores user's saved addresses as a JSON string.
    # For PostgreSQL, you might use db.JSON or JSONB for better JSON handling.
    saved_addresses_json = db.Column(db.Text, nullable=True) 

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc)) # Timestamp for when the user was created, defaults to current UTC time

    # Relationship to Orders (we'll define the Order model later)
    # orders = db.relationship('Order', backref='customer', lazy=True) # 'customer' is how User is referred from Order

    def set_password(self, password):
        """Hashes the provided password and stores it."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Checks if the provided password matches the stored hash."""
        return check_password_hash(self.password_hash, password)

    def add_address(self, address_dict):
        """Adds a new address to the user's list of saved addresses."""
        addresses = json.loads(self.saved_addresses_json) if self.saved_addresses_json else []
        # You might want to add logic here to prevent duplicate addresses or assign IDs to addresses
        addresses.append(address_dict)
        self.saved_addresses_json = json.dumps(addresses)

    def get_addresses(self):
        """Retrieves the list of saved addresses."""
        return json.loads(self.saved_addresses_json) if self.saved_addresses_json else []

    def __repr__(self):
        """String representation of the User object, useful for debugging."""
        return f'<User {self.id}: {self.email}>'
    
class MenuItem(db.Model):
    __tablename__ = 'menu_items'

    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), index=True, nullable=False) 
    sub_category = db.Column(db.String(50), nullable=True) 
    price = db.Column(db.Float, default=0.0)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(50), nullable=True)
    available_for_periods = db.Column(db.String(100), nullable=True) 
    sold_out = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    attributes_json = db.Column(db.Text, nullable=True)

    def to_dict(self):
        data = {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'sub_category': self.sub_category,
            'price': self.price,
            'description': self.description,
            'icon': self.icon,
            'availableFor': self.available_for_periods.split(',') if self.available_for_periods else [],
            'soldOut': self.sold_out,
            'attributes': json.loads(self.attributes_json) if self.attributes_json else {}
        }
        if self.price > 0 and 'basePrice' not in data['attributes']:
             data['attributes']['price'] = self.price
        return data

    def __repr__(self):
        return f'<MenuItem {self.id}: {self.name}>'
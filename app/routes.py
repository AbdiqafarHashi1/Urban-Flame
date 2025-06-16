"""
routes.py  –  Urban Flame API (Blueprint: /api)
Last updated: 2025-06-16
"""

from flask import Blueprint, request, jsonify
from .models import User, MenuItem
from . import db
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")

# ╭───────────────────────────── AUTH ─────────────────────────────╮
@api_bp.route("/auth/register", methods=["POST"])
def register():
    data      = request.get_json(silent=True) or {}
    email     = data.get("email")
    password  = data.get("password")
    name      = data.get("name")

    if not all([email, password, name]):
        return jsonify({"msg": "Missing email, password, or name"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already exists"}), 409

    user = User(email=email, name=name)
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({"msg": "Could not create user", "error": str(exc)}), 500

    return (
        jsonify(
            {
                "msg": "User created successfully",
                "user": {"id": user.id, "email": user.email, "name": user.name},
            }
        ),
        201,
    )


@api_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email, password = data.get("email"), data.get("password")

    if not all([email, password]):
        return jsonify({"msg": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        token = create_access_token(identity=str(user.id))
        return jsonify(access_token=token, user_id=user.id, name=user.name), 200

    return jsonify({"msg": "Bad email or password"}), 401


@api_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def me():
    uid   = get_jwt_identity()
    user  = User.query.get(uid)
    if not user:
            return jsonify({"msg": "User not found"}), 404

    return (
        jsonify(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "saved_addresses": user.get_addresses(),
                "created_at": user.created_at.isoformat(),
            }
        ),
        200,
    )
# ╰────────────────────────────────────────────────────────────────╯


# ╭─────────────────────── STORE CONFIG ─────────────────────────╮
@api_bp.route("/config", methods=["GET"])
def get_config():
    """
    Supplies the SPA with store hours, delivery fee, promo codes, and other
    global constants. Swap these literals for DB-driven values later.
    """
    return (
        jsonify(
            {
                # Store hours  (decimal hours allow easy numeric compare in JS)
                "mealPeriods": [
                    {"id": "breakfast", "name": "Breakfast", "from": 6.0,  "to": 11.0},
                    {"id": "lunch",     "name": "Lunch",     "from": 11.0, "to": 17.0},
                    {"id": "dinner",    "name": "Dinner",    "from": 17.0, "to": 22.0},
                ],

                # Checkout maths
                "deliveryFee":         150,   # KES
                "freeToppingsCount":     3,
                "defaultProteinGrams": 150,
                "minProteinGrams":     100,

                # Promo codes
                "promoCodes": {
                    "FLAME10": {"type": "percentage", "value": 10},
                    "SAVE50":  {"type": "fixed",      "value": 50},
                },

                # Extra-protein catalogue (optional – used by saladette builder)
                "extraProteinOptions": [
                    {
                        "id": "extra_camel_lunch",
                        "name": "Extra Camel Suqaar",
                        "perGram": 2.8,
                        "minGrams": 80,
                        "availableFor": ["lunch", "dinner"],
                    },
                    {
                        "id": "extra_goat_lunch",
                        "name": "Extra Goat Suqaar",
                        "perGram": 2.5,
                        "minGrams": 80,
                        "availableFor": ["lunch", "dinner"],
                    },
                    {
                        "id": "extra_chicken_mishkaki",
                        "name": "Extra Chicken Mishkaki",
                        "perGram": 1.6,
                        "minGrams": 60,
                        "availableFor": ["breakfast", "lunch"],
                    },
                    {
                        "id": "extra_liver_suqaar",
                        "name": "Extra Liver Suqaar",
                        "perGram": 1.5,
                        "minGrams": 60,
                        "availableFor": ["breakfast"],
                    },
                    {
                        "id": "extra_beans_veg",
                        "name": "Extra Mixed Beans",
                        "perGram": 1.0,
                        "minGrams": 80,
                        "availableFor": ["breakfast", "lunch", "dinner"],
                    },
                ],
            }
        ),
        200,
    )
# ╰───────────────────────────────────────────────────────────────╯


# ╭──────────────────────────── MENU ─────────────────────────────╮
@api_bp.route("/menu", methods=["GET"])
def get_menu():
    """
    Returns the full menu grouped under camel-case keys that the SPA expects.
    """
    items = MenuItem.query.all()
    resp  = {
        "proteins": [],
        "bases": [],
        "saladToppings": [],
        "sauces": [],
        "extras": [],
        "setMeals": [],
        "pizza": [],
        "dessert": [],
        "drink": [],
        "side": [],
        "special": [],
    }

    mapping = {
        "protein":        "proteins",
        "base":           "bases",
        "salad_topping":  "saladToppings",
        "sauce":          "sauces",
        "extra":          "extras",
        "set_meal":       "setMeals",
        # default: cat itself (pizza, dessert, drink, side, special)
    }

    for item in items:
        key = mapping.get(item.category, item.category)
        resp.setdefault(key, []).append(item.to_dict())

    return jsonify(resp), 200
# ╰───────────────────────────────────────────────────────────────╯

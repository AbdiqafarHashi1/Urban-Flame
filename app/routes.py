"""
routes.py – Urban Flame API
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Dict, List

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from . import db
from .models import MenuItem, User

api_bp = Blueprint("api", __name__, url_prefix="/api")

# ────────────────────────── AUTH ────────────────────────── #
@api_bp.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    email, password, name = (
        data.get("email"),
        data.get("password"),
        data.get("name"),
    )

    if not all([email, password, name]):
        return jsonify(msg="Missing email, password, or name"), 400
    if User.query.filter_by(email=email).first():
        return jsonify(msg="Email already exists"), 409

    user = User(email=email, name=name)
    user.set_password(password)
    try:
        db.session.add(user)
        db.session.commit()
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        return jsonify(msg="Could not create user", error=str(exc)), 500

    return (
        jsonify(
            msg="User created successfully",
            user={"id": user.id, "email": user.email, "name": user.name},
        ),
        201,
    )


@api_bp.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email, password = data.get("email"), data.get("password")
    if not all([email, password]):
        return jsonify(msg="Missing email or password"), 400

    user: User | None = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        token = create_access_token(identity=str(user.id))
        return jsonify(access_token=token, user_id=user.id, name=user.name), 200
    return jsonify(msg="Bad email or password"), 401


@api_bp.get("/auth/me")
@jwt_required()
def me():
    user: User | None = User.query.get(get_jwt_identity())
    if not user:
        return jsonify(msg="User not found"), 404
    return (
        jsonify(
            id=user.id,
            name=user.name,
            email=user.email,
            saved_addresses=user.get_addresses(),
            created_at=user.created_at.isoformat(),
        ),
        200,
    )

# ─────────────────── GLOBAL STORE CONFIG ─────────────────── #
@api_bp.get("/config")
def get_config():
    """Values that rarely change and are cached aggressively by the SPA."""
    return (
        jsonify(
            mealTypes=[
                {"id": "bowl", "name": "Bowl", "icon": "fas fa-bowl-rice"},
                {"id": "wrap", "name": "Wrap", "icon": "fas fa-burrito"},
                {"id": "burger", "name": "Burger", "icon": "fas fa-hamburger"},
                {"id": "salad", "name": "Salad", "icon": "fas fa-seedling"},
            ],
            mealPeriods=[
                {"id": "breakfast", "name": "Breakfast", "from": 6.0, "to": 11.0},
                {"id": "lunch", "name": "Lunch", "from": 11.0, "to": 17.0},
                {"id": "dinner", "name": "Dinner", "from": 17.0, "to": 23.0},
            ],
            deliveryFee=150,
            freeToppingsCount=3,
            defaultProteinGrams=150,
            minProteinGrams=100,
            promoCodes={
                "FLAME10": {"type": "percentage", "value": 10},
                "SAVE50": {"type": "fixed", "value": 50},
            },
            extraProteinOptions=[
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
                # … add the rest if you wish …
            ],
        ),
        200,
    )

# ─────────────────────────── MENU ─────────────────────────── #
def _row_to_frontend_dict(row: MenuItem) -> Dict:
    """
    Convert a MenuItem SQLAlchemy row into the exact JSON shape
    the front-end (script.js) expects.
    """
    item = {
        "id":         row.id,
        "name":       row.name,
        "icon":       row.icon,
        "price":      row.price,       # simple numeric price
        "soldOut":    row.sold_out,
        "availableFor": (
            [p.strip() for p in row.available_for_periods.split(",")]
            if row.available_for_periods else []
        ),
    }

    if row.attributes_json:
        try:
            raw = json.loads(row.attributes_json)
            item["attributes"] = {
                "basePrice":     raw.get("basePrice")     or raw.get("base_price"),
                "perGramExtra":  raw.get("perGramExtra")  or raw.get("per_gram_extra"),
                "defaultGrams":  raw.get("defaultGrams")  or raw.get("default_grams"),
                "minGrams":      raw.get("minGrams")      or raw.get("min_grams"),
                "type":          raw.get("type"),
            }
        except Exception:
            item["attributes"] = {}

    return item


@api_bp.get("/menu")
def get_menu():
    """
    Return the entire menu grouped using the camel-case plural keys
    the front-end (script.js) looks for.
    """
    response: Dict[str, List[Dict]] = {
        "proteins": [],
        "bases": [],
        "saladToppings": [],
        "sauces": [],
        "extras": [],
        "set_meal": [],
        "pizza": [],
        "dessert": [],
        "drink": [],
        "side": [],
        "special": [],
    }

    # DB category → front-end key
    mapping = {
        "protein":        "proteins",
        "base":           "bases",
        "salad_topping":  "saladToppings",
        "sauce":          "sauces",
        "extra":          "extras",
        # any other categories keep their own name
    }

    for row in MenuItem.query.all():
        key = mapping.get(row.category, row.category)
        response.setdefault(key, []).append(_row_to_frontend_dict(row))

    return jsonify(response), 200

"""
Seed the database with full Urban Flame menu data.
Run:  python seed.py
"""

import json
from app import create_app, db
from app.models import MenuItem

# ─────────────────────────────────────────────────────────────────────────────
# COMPLETE MENU DATA
# ─────────────────────────────────────────────────────────────────────────────
menu_data = {
    # PROTEINS
    "protein": [
        {
            "id": "liver_suqaar",
            "name": "Liver Suqaar",
            "icon": "fas fa-bacon",
            "basePrice": 280,
            "perGramExtra": 1.5,
            "defaultGrams": 120,
            "minGrams": 100,
            "availableFor": ["breakfast"],
        },
        {
            "id": "beef_qado_protein",
            "name": "Beef Qado (Suqaar)",
            "icon": "fas fa-drumstick-bite",
            "basePrice": 300,
            "perGramExtra": 1.8,
            "defaultGrams": 120,
            "minGrams": 100,
            "availableFor": ["breakfast"],
        },
        {
            "id": "chicken_mishkaki_chunks",
            "name": "Chicken Mishkaki Chunks",
            "icon": "fas fa-pepper-hot",
            "basePrice": 280,
            "perGramExtra": 1.6,
            "defaultGrams": 120,
            "minGrams": 100,
            "availableFor": ["breakfast", "lunch"],
        },
        {
            "id": "scrambled_eggs",
            "name": "Scrambled Eggs",
            "icon": "fas fa-egg",
            "basePrice": 180,
            "perGramExtra": 0,
            "defaultGrams": 150,
            "minGrams": 120,
            "availableFor": ["breakfast"],
        },
        {
            "id": "goat_lunch",
            "name": "Goat Suqaar (Lunch)",
            "icon": "fas fa-drumstick-bite",
            "basePrice": 400,
            "perGramExtra": 2.5,
            "defaultGrams": 150,
            "minGrams": 100,
            "availableFor": ["lunch", "dinner"],
        },
        {
            "id": "camel_lunch",
            "name": "Camel Suqaar (Lunch)",
            "icon": "fas fa-paw",
            "basePrice": 450,
            "perGramExtra": 2.8,
            "defaultGrams": 150,
            "minGrams": 100,
            "availableFor": ["lunch", "dinner"],
        },
        {
            "id": "grilled_chicken_lunch",
            "name": "Grilled Chicken Pieces",
            "icon": "fas fa-drumstick-bite",
            "basePrice": 380,
            "perGramExtra": 2.2,
            "defaultGrams": 150,
            "minGrams": 100,
            "availableFor": ["lunch"],
        },
        {
            "id": "tuna_masala_lunch",
            "name": "Tuna Masala",
            "icon": "fas fa-fish",
            "basePrice": 420,
            "perGramExtra": 2.6,
            "defaultGrams": 150,
            "minGrams": 100,
            "availableFor": ["lunch"],
        },
        {
            "id": "fried_chicken_pieces_lunch",
            "name": "Fried Chicken Pieces (BYO)",
            "icon": "fas fa-drumstick-bite",
            "basePrice": 350,
            "perGramExtra": 2.0,
            "defaultGrams": 150,
            "minGrams": 100,
            "availableFor": ["lunch", "dinner"],
        },
        {
            "id": "mediterranean_chicken_dinner",
            "name": "Mediterranean Chicken",
            "icon": "fas fa-drumstick-bite",
            "basePrice": 430,
            "perGramExtra": 2.3,
            "defaultGrams": 150,
            "minGrams": 100,
            "availableFor": ["dinner"],
        },
    ],
    # BASES
    "base": [
        {
            "id": "malawax",
            "name": "Malawax (Somali Flatbread)",
            "icon": "far fa-circle",
            "price": 0,
            "availableFor": ["breakfast"],
        },
        {
            "id": "anjera",
            "name": "Anjera (Fermented Bread)",
            "icon": "far fa-circle",
            "price": 0,
            "availableFor": ["breakfast"],
        },
        {
            "id": "scrambled_eggs_base",
            "name": "Scrambled Eggs (base)",
            "icon": "fas fa-egg",
            "price": 0,
            "availableFor": ["breakfast"],
        },
        {
            "id": "white_rice",
            "name": "White Rice",
            "icon": "fas fa-bowl-rice",
            "price": 0,
            "availableFor": ["lunch", "dinner"],
        },
        {
            "id": "biryani_rice",
            "name": "Biryani Rice",
            "icon": "fas fa-bowl-rice",
            "price": 50,
            "availableFor": ["lunch", "dinner"],
        },
        {
            "id": "mashed_potatoes",
            "name": "Mashed Potatoes",
            "icon": "fas fa-stroopwafel",
            "price": 0,
            "availableFor": ["breakfast", "lunch"],
        },
        {
            "id": "potato_wedges",
            "name": "Potato Wedges",
            "icon": "fas fa-cubes-stacked",
            "price": 0,
            "availableFor": ["lunch", "dinner"],
        },
        {
            "id": "chapati",
            "name": "Chapati",
            "icon": "far fa-circle",
            "price": 0,
            "availableFor": ["dinner"],
        },
        {
            "id": "tortilla_wrap_base",
            "name": "Tortilla (for Wrap)",
            "icon": "fas fa-circle-notch",
            "price": 0,
            "availableFor": ["breakfast", "lunch", "dinner"],
        },
        {
            "id": "fries_base",
            "name": "Fries (base)",
            "icon": "fas fa-bacon",
            "price": 0,
            "availableFor": ["lunch", "dinner"],
        },
        {
            "id": "burger_bun",
            "name": "Burger Bun",
            "icon": "fas fa-hamburger",
            "price": 0,
            "availableFor": ["dinner"],
        },
        {
            "id": "taco_shells_3",
            "name": "Taco Shells (3)",
            "icon": "fas fa-mortar-pestle",
            "price": 0,
            "availableFor": ["dinner"],
        },
    ],
    # SALAD TOPPINGS
    "salad_topping": [
        {
            "id": "lettuce",
            "name": "Lettuce",
            "icon": "fas fa-leaf",
            "price": 30,
            "availableFor": ["breakfast", "lunch", "dinner"],
        },
        {
            "id": "corn_salsa",
            "name": "Corn Salsa",
            "icon": "fas fa-corn",
            "price": 40,
            "availableFor": ["breakfast", "lunch", "dinner"],
        },
    ],
    # SAUCES
    "sauce": [
        {
            "id": "garlic_mayo",
            "name": "Garlic Mayo",
            "icon": "fas fa-mortar-pestle",
            "price": 0,
            "availableFor": ["breakfast", "lunch", "dinner"],
        }
    ],
    # EXTRAS
    "extra": [
        {
            "id": "guacamole_scoop",
            "name": "Guacamole (1 scoop)",
            "icon": "fas fa-avocado",
            "price": 150,
            "availableFor": ["lunch", "dinner"],
        }
    ],
    # SET MEALS
    "set_meal": [
        {
            "id": "ln_loaded_fries_set",
            "name": "Loaded Fries (Set)",
            "sub_category": "lunch_set_meal",
            "price": 600,
            "icon": "fas fa-bacon",
            "availableFor": ["lunch", "dinner"],
            "description": "Fries loaded with protein choice, salad, cheese, sauces.",
        }
    ],
    # DRINKS
    "drink": [
        {
            "id": "soda_coke_300ml",
            "name": "Coca-Cola (300 ml)",
            "sub_category": "drink",
            "price": 100,
            "icon": "fas fa-wine-bottle",
            "availableFor": ["breakfast", "lunch", "dinner"],
        }
    ],
    # SPECIALS
    "special": [
        {
            "id": "sp_ln_chef_bowl",
            "name": "Chef’s Special Lunch Bowl",
            "sub_category": "lunch_special",
            "price": 650,
            "icon": "fas fa-star",
            "availableFor": ["lunch"],
            "description": "Unique ingredients, changes weekly!",
        }
    ],
}

# ─────────────────────────────────────────────────────────────────────────────
# SEED ROUTINE
# ─────────────────────────────────────────────────────────────────────────────
def seed_database():
    app = create_app()
    with app.app_context():
        db.create_all() 
        print("Clearing existing menu items …")
        MenuItem.query.delete()
        db.session.commit()

        new_items = []
        for category, items in menu_data.items():
            for entry in items:
                attrs = {}
                if category == "protein":
                    for key in (
                        "basePrice",
                        "perGramExtra",
                        "defaultGrams",
                        "minGrams",
                        "type",
                    ):
                        if key in entry:
                            attrs[key] = entry[key]

                new_items.append(
                    MenuItem(
                        id=entry["id"],
                        name=entry["name"],
                        category=category,
                        sub_category=entry.get("sub_category"),
                        price=entry.get("price", 0)
                        or entry.get("basePrice", 0),
                        description=entry.get("description"),
                        icon=entry.get("icon"),
                        available_for_periods=",".join(entry.get("availableFor", [])),
                        sold_out=entry.get("soldOut", False),
                        attributes_json=json.dumps(attrs) if attrs else None,
                    )
                )

        db.session.bulk_save_objects(new_items)
        db.session.commit()
        print(f"Seeded {len(new_items)} menu items.")


if __name__ == "__main__":
    seed_database()

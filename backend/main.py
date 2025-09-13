import os
import openai
import asyncpg
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict

# ─── Configuration ────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/yourdb")
openai.api_key = os.getenv("OPENAI_API_KEY", "YOUR_KEY_HERE")

# ─── Few‑Shot Examples ─────────────────────────────────────────────────────────
PASTA_EXAMPLES = [
    {
      "name": "white sauce pasta",
      "servings": 2,
      "ingredients": [
        {"item": "pasta", "qty": 200, "unit": "g"},
        {"item": "butter", "qty": 30, "unit": "g"},
        {"item": "all‑purpose flour", "qty": 20, "unit": "g"},
        {"item": "milk", "qty": 250, "unit": "ml"},
        {"item": "salt", "qty": 1, "unit": "tsp"},
      ]
    },
    {
      "name": "tomato basil pasta",
      "servings": 2,
      "ingredients": [
        {"item": "pasta", "qty": 200, "unit": "g"},
        {"item": "tomato sauce", "qty": 150, "unit": "ml"},
        {"item": "basil", "qty": 5, "unit": "leaves"},
        {"item": "garlic", "qty": 2, "unit": "cloves"}
      ]
    }
]

# ─── Pydantic Models ───────────────────────────────────────────────────────────
class RecipeRequest(BaseModel):
    recipe_name: str
    servings: int

class Ingredient(BaseModel):
    item: str
    qty: float
    unit: str

# ─── App & Helpers ─────────────────────────────────────────────────────────────
app = FastAPI()

async def get_db_conn():
    return await asyncpg.connect(DATABASE_URL)

def parse_ingredients(text: str) -> List[Dict]:
    out = []
    for line in text.splitlines():
        if line.startswith("-"):
            parts = line[1:].strip().split()
            qty, unit = float(parts[0]), parts[1]
            item = " ".join(parts[2:])
            out.append({"item": item, "qty": qty, "unit": unit})
    return out

async def get_ingredients(recipe: str, servings: int) -> List[Dict]:
    # build few‑shot prompt
    examples = "\n\n".join(
      f"Recipe: {ex['name']} for {ex['servings']} servings\nIngredients:\n" +
      "\n".join(f"- {i['qty']} {i['unit']} {i['item']}" for i in ex['ingredients'])
      for ex in PASTA_EXAMPLES
    )
    prompt = (
      examples +
      f"\n\nNow, Recipe: {recipe} for {servings} servings\nIngredients:"
    )
    resp = openai.ChatCompletion.create(
      model="gpt-3.5-turbo",
      messages=[{"role":"user","content":prompt}],
      temperature=0.2
    )
    return parse_ingredients(resp.choices[0].message.content)

# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.post("/add_to_cart")
async def add_to_cart(req: RecipeRequest):
    conn = await get_db_conn()
    ing_list = await get_ingredients(req.recipe_name, req.servings)
    cart, recs = [], []

    async with conn.transaction():
        for ing in ing_list:
            row = await conn.fetchrow(
              "SELECT qty_available FROM inventory WHERE name=$1", ing["item"]
            )
            if row and row["qty_available"] >= ing["qty"]:
                cart.append(ing)
                await conn.execute(
                  "UPDATE inventory SET qty_available = qty_available - $1 WHERE name=$2",
                  ing["qty"], ing["item"]
                )
            else:
                subs = await conn.fetch(
                  "SELECT substitute FROM substitutions WHERE original=$1", ing["item"]
                )
                recs.append({
                  "needed": ing["item"],
                  "alternatives": [r["substitute"] for r in subs] or []
                })

    await conn.close()
    return {"cart": cart, "recommendations": recs}


@app.post("/weekly_plan")
async def weekly_plan(body: Dict):
    plan: Dict[str, Dict[str, str]] = body["plan"]
    servings: int = body["servings"]
    master_cart, master_recs = [], []

    # reuse add_to_cart logic
    for day_meals in plan.values():
        for recipe in day_meals.values():
            result = await add_to_cart(RecipeRequest(recipe_name=recipe, servings=servings))
            master_cart += result["cart"]
            master_recs += result["recommendations"]

    # sum quantities
    from collections import defaultdict
    summed = defaultdict(lambda: {"qty":0, "unit": None})
    for ing in master_cart:
        summed[ing["item"]]["qty"] += ing["qty"]
        summed[ing["item"]]["unit"] = ing["unit"]

    weekly_cart = [{"item": k, "qty": v["qty"], "unit": v["unit"]} for k, v in summed.items()]
    return {"weekly_cart": weekly_cart, "weekly_recommendations": master_recs}

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3 as db
from typing import List, Dict

app = FastAPI()

# Allow React to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "expenseTracker.db"

def init_db():
    with db.connect(DB_NAME) as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                date TEXT, name TEXT, title TEXT, expense REAL
            )
        """)

init_db()

# --- STANDARD EXPENSE MODELS ---
class ExpenseBase(BaseModel):
    date: str
    name: str
    title: str
    expense: float

class ExpenseResponse(ExpenseBase):
    id: int

# --- SMART SETTLEMENT MODELS ---
class Debt(BaseModel):
    debtor: str
    creditor: str
    amount: float

class SettlementRequest(BaseModel):
    debts: List[Debt]


# ==========================================
# STANDARD EXPENSE ENDPOINTS
# ==========================================

@app.get("/api/expenses", response_model=List[ExpenseResponse])
def get_expenses(search: str = ""):
    with db.connect(DB_NAME) as con:
        con.row_factory = db.Row # Returns dict-like rows
        query = "SELECT rowid as id, date, name, title, expense FROM expenses"
        params = ()
        
        if search:
            query += " WHERE name LIKE ? OR title LIKE ? OR date LIKE ?"
            search_term = f"%{search}%"
            params = (search_term, search_term, search_term)
            
        rows = con.execute(query, params).fetchall()
        return [dict(row) for row in rows]

@app.post("/api/expenses")
def add_expense(expense: ExpenseBase):
    with db.connect(DB_NAME) as con:
        con.execute(
            "INSERT INTO expenses (date, name, title, expense) VALUES (?,?,?,?)",
            (expense.date, expense.name, expense.title, expense.expense)
        )
    return {"message": "Expense added successfully"}

@app.delete("/api/expenses/{item_id}")
def delete_expense(item_id: int):
    with db.connect(DB_NAME) as con:
        con.execute("DELETE FROM expenses WHERE rowid = ?", (item_id,))
    return {"message": "Expense deleted successfully"}


# ==========================================
# ADVANCED ALGORITHM ENDPOINTS
# ==========================================

@app.post("/api/settle-debts")
def calculate_smart_settlement(request: SettlementRequest):
    # 1. Calculate net balance for every person
    balances: Dict[str, float] = {}
    
    for debt in request.debts:
        # Debtor loses money (negative)
        balances[debt.debtor] = balances.get(debt.debtor, 0) - debt.amount
        # Creditor gains money (positive)
        balances[debt.creditor] = balances.get(debt.creditor, 0) + debt.amount

    # 2. Separate into Debtors and Creditors
    debtors = []   # People who owe money
    creditors = [] # People who are owed money
    
    for person, balance in balances.items():
        if balance < 0:
            debtors.append({"name": person, "amount": abs(balance)})
        elif balance > 0:
            creditors.append({"name": person, "amount": balance})

    # Sort both lists by amount descending (Greedy approach)
    debtors.sort(key=lambda x: x["amount"], reverse=True)
    creditors.sort(key=lambda x: x["amount"], reverse=True)

    # 3. Calculate minimum transactions
    optimized_transactions = []
    i, j = 0, 0
    
    while i < len(debtors) and j < len(creditors):
        debt_amount = debtors[i]["amount"]
        credit_amount = creditors[j]["amount"]
        
        # Find the minimum amount that can be settled between these two
        settled_amount = min(debt_amount, credit_amount)
        
        optimized_transactions.append({
            "from": debtors[i]["name"],
            "to": creditors[j]["name"],
            "amount": round(settled_amount, 2)
        })
        
        # Deduct the settled amount
        debtors[i]["amount"] -= settled_amount
        creditors[j]["amount"] -= settled_amount
        
        # Move to the next person if their balance is fully settled
        if debtors[i]["amount"] == 0:
            i += 1
        if creditors[j]["amount"] == 0:
            j += 1

    return {"optimized_settlements": optimized_transactions}
# 🏆 HACKATHON WINNING STRATEGY: MISE AI x ARC/CIRCLE

> **Hackathon:** Agentic Commerce on Arc  
> **Dates:** Jan 9-24, 2026  
> **Prize Pool:** $10,000 USDC + $10,000 GCP Credits

---

## 🎯 EXECUTIVE SUMMARY

**Project Name:** **Mise AI - The First Autonomous Kitchen Commerce Agent**

**One-Line Pitch:**  
> "Mise AI is an autonomous kitchen commerce agent that analyzes your nutrition, manages your pantry, and autonomously purchases groceries via x402 micropayments on Arc—all orchestrated by Gemini AI."

**Primary Track:** 🤖 **Best Trustless AI Agent**  
**Secondary Tracks:** 🛒 Best Autonomous Commerce Application + 🪙 Best Gateway Micropayments

---

## 🔗 ALIGNMENT WITH YOUR CURRENT CODEBASE

### What Mise AI Already Does (Existing Features)

| Feature | Current Status | Hackathon Enhancement |
|---------|---------------|----------------------|
| **AI Orchestrator** | Flask + OpenAI-compatible API | → Switch to **Gemini API** |
| **Inventory Management** | Full CRUD via Supabase | → Add **x402 auto-restock triggers** |
| **Shopping Lists** | Full CRUD via Supabase | → Add **x402 autonomous purchasing** |
| **Leftovers Tracking** | Full CRUD via Supabase | → Keep as-is (reduces waste story) |
| **Amazon Search** | Placeholder handlers | → Replace with **x402-gated grocery API** |
| **User Preferences** | Dietary goals, restrictions | → Add **spending limits, wallet config** |

### What We Add (New Features for Hackathon)

1. **Circle Wallet Integration** - Each user gets a wallet for USDC on Arc
2. **x402 Payment Layer** - Autonomous micropayments for grocery purchases
3. **Gemini AI Upgrade** - Replace current LLM with Gemini 3 Flash/Pro
4. **Autonomous Commerce Flow** - AI decides AND executes purchases
5. **Transaction Verification** - On-chain proof on Arc blockchain

---

## 🚀 THE CORE INNOVATION

### The Problem We Solve

Traditional meal planning apps tell you WHAT to buy. **They don't actually BUY it for you.**

Smart assistants suggest recipes, but when you're out of ingredients, you still have to:

1. Open a separate app
2. Search for products
3. Add to cart
4. Enter payment details
5. Checkout

**This breaks the flow.** The AI should just... handle it.

### Our Solution: Autonomous Grocery Commerce

Mise AI becomes the **first kitchen AI agent that can autonomously purchase groceries** using x402 micropayments on Arc:

```
User: "I want to make pasta tonight but I'm out of tomatoes"

Mise AI: 
  1. ✅ Checks inventory → No tomatoes
  2. ✅ Checks user budget → $5 daily grocery limit
  3. ✅ Queries grocery API (x402: $0.001 per search)
  4. ✅ Finds best deal: Organic Roma Tomatoes ($2.99)
  5. ✅ Executes purchase via x402 ($2.99 + $0.01 fee)
  6. ✅ Updates inventory with expected delivery
  
"I've ordered organic Roma tomatoes ($2.99) - arriving by 6 PM. 
Your pasta ingredients are now complete. Want the recipe?"
```

---

## 🏗️ TECHNICAL ARCHITECTURE

### System Overview (Aligned with Current Codebase)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    MISE AI x ARC ARCHITECTURE                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  LAYER 1: FRONTEND (src/) - EXISTING                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  React + TypeScript + Tailwind (existing)                             │ │
│  │  + Circle Wallet Connect Component (NEW)                              │ │
│  │  + Transaction History Panel (NEW)                                    │ │
│  │  + Spending Limits Config (NEW)                                       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  LAYER 2: AI ORCHESTRATION (mise-asi/) - ENHANCED                          │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  orchestration/orchestrator.py (existing)                             │ │
│  │  → Replace OpenAI client with GEMINI API                              │ │
│  │  → Add x402 payment execution in function calling loop                │ │
│  │                                                                       │ │
│  │  NEW handlers:                                                        │ │
│  │  ├── handlers/x402_handlers.py    - Payment execution                 │ │
│  │  ├── handlers/wallet_handlers.py  - Wallet management                 │ │
│  │  └── handlers/commerce_handlers.py - Purchase orchestration           │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  LAYER 3: x402 PAYMENT GATEWAY (NEW)                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  mise-asi/x402/                                                       │ │
│  │  ├── client.py       - Make x402 requests                             │ │
│  │  ├── facilitator.py  - Verify/submit payments via Circle              │ │
│  │  ├── wallet.py       - Circle Wallet SDK integration                  │ │
│  │  └── models.py       - Payment request/response types                 │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  LAYER 4: EXTERNAL SERVICES                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────┐ │ │
│  │  │ Gemini API      │  │ Circle Wallets  │  │ x402 Grocery API      │ │ │
│  │  │ (AI reasoning)  │  │ (USDC on Arc)   │  │ (simulated for demo)  │ │ │
│  │  └─────────────────┘  └─────────────────┘  └───────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  LAYER 5: BLOCKCHAIN (Arc L1)                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  USDC Native Gas | Circle Wallets | Arc Block Explorer Verification   │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 FILE CHANGES (Aligned with Current Structure)

### Files to MODIFY

```
mise-asi/
├── orchestration/
│   └── orchestrator.py          # MODIFY: Switch to Gemini API
│                                 #         Add x402 tool definitions
│                                 #         Add payment execution flow
│
├── handlers/
│   ├── __init__.py              # MODIFY: Register new handlers
│   ├── amazon_search_handlers.py # MODIFY → commerce_handlers.py
│   │                             #          Real x402 grocery search
│   └── shopping_list_handlers.py # MODIFY: Add auto-purchase trigger
│
├── config/
│   └── settings.py              # MODIFY: Add Circle/Gemini/Arc configs

src/
├── hooks/
│   └── useChat.ts               # MODIFY: Handle transaction UI updates
├── components/
│   └── Chatbot.tsx              # MODIFY: Show transaction confirmations
```

### Files to CREATE

```
mise-asi/
├── x402/                        # NEW DIRECTORY
│   ├── __init__.py
│   ├── client.py                # x402 HTTP client
│   ├── facilitator.py           # Circle Facilitator integration
│   ├── wallet.py                # Circle Wallet SDK wrapper
│   ├── models.py                # PaymentRequest, PaymentProof types
│   └── arc_client.py            # Arc RPC for tx verification
│
├── handlers/
│   ├── wallet_handlers.py       # NEW: getBalance, getWalletAddress
│   ├── commerce_handlers.py     # NEW: searchGroceries, purchaseItem
│   └── transaction_handlers.py  # NEW: getTransactionHistory

src/
├── components/
│   ├── x402/
│   │   ├── WalletConnect.tsx    # Circle Wallet connect button
│   │   ├── TransactionList.tsx  # Recent purchases
│   │   ├── SpendingLimits.tsx   # Daily/weekly limits config
│   │   └── PurchaseConfirm.tsx  # Approval modal for purchases
│
├── hooks/
│   ├── useWallet.ts             # Circle Wallet state management
│   └── useTransactions.ts       # Transaction history
```

---

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### 1. Gemini API Integration (orchestrator.py)

Replace the current OpenAI client with Gemini:

```python
# BEFORE (current)
from openai import OpenAI
self.client = OpenAI(
    api_key=settings.ASICLOUD_API_KEY,
    base_url=settings.ASICLOUD_BASE_URL
)

# AFTER (hackathon)
import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)
self.model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-exp",  # or gemini-pro for complex reasoning
    tools=self._get_tools()
)
```

**Why Gemini 3 Flash:** Optimized for transactional agents, low latency for payment flows.

### 2. x402 Payment Flow

```python
# mise-asi/x402/client.py

import httpx
from typing import Optional
from .models import PaymentRequest, PaymentProof

class X402Client:
    """x402 HTTP client for making paid requests"""
    
    async def request_with_payment(
        self,
        url: str,
        wallet: "CircleWallet",
        max_cost: float = 0.10
    ) -> dict:
        """Make an HTTP request, handling 402 Payment Required"""
        
        async with httpx.AsyncClient() as client:
            # Step 1: Initial request
            response = await client.get(url)
            
            # Step 2: Check for payment requirement
            if response.status_code == 402:
                payment_req = PaymentRequest.from_headers(response.headers)
                
                # Validate against spending limit
                if payment_req.amount > max_cost:
                    raise Exception(f"Cost ${payment_req.amount} exceeds limit ${max_cost}")
                
                # Step 3: Execute payment
                payment_proof = await self.execute_payment(wallet, payment_req)
                
                # Step 4: Retry with payment proof
                response = await client.get(
                    url,
                    headers={"X-Payment-Proof": payment_proof.to_header()}
                )
            
            return response.json()
```

### 3. New Tool Definitions (for Gemini function calling)

```python
X402_TOOLS = [
    {
        "name": "getWalletBalance",
        "description": "Get user's USDC balance on Arc",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "searchGroceryProducts",
        "description": "Search for grocery products. Costs $0.001 USDC per search via x402.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Product to search for"},
                "max_price": {"type": "number", "description": "Maximum price in USD"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "purchaseGroceryItem",
        "description": "Purchase a grocery item using USDC. Requires user approval for amounts over daily limit.",
        "input_schema": {
            "type": "object",
            "properties": {
                "product_id": {"type": "string"},
                "quantity": {"type": "integer", "default": 1},
                "reason": {"type": "string", "description": "Why this purchase is recommended"}
            },
            "required": ["product_id", "reason"]
        }
    },
    {
        "name": "getTransactionHistory",
        "description": "Get recent x402 payment transactions",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "default": 10}
            }
        }
    }
]
```

### 4. Autonomous Purchase Decision Logic

```python
# In orchestrator.py system prompt addition

COMMERCE_SYSTEM_PROMPT = """
## AUTONOMOUS COMMERCE RULES

You have a USDC wallet on Arc and can make purchases via x402 micropayments.

### When to AUTO-PURCHASE (no confirmation needed):
- Amount is under user's daily auto-approve limit (default: $5)
- Item is on the shopping list
- User has explicitly said "just order it" or similar

### When to ASK for CONFIRMATION:
- Amount exceeds auto-approve limit
- Item is not on shopping list (impulse buy)
- Total daily spending would exceed weekly budget

### Purchase Decision Workflow:
1. Check inventory for missing ingredient
2. Check if item is on shopping list
3. Search for best price via x402 ($0.001 cost)
4. If price is within limits, execute purchase
5. Update inventory with expected delivery
6. Inform user of purchase with transaction hash

### Budget Awareness:
- Always check getWalletBalance before suggesting purchases
- Warn user if balance is low
- Show running total of daily spending
"""
```

---

## 🎬 DEMO SCRIPT (3 Minutes)

### Scene 1: The Hook (30 seconds)

*Open Mise AI chat interface*

> "Meet Mise AI - your AI kitchen assistant. But unlike other meal planners, Mise has something special: a crypto wallet."

*Show wallet balance in UI: 25.00 USDC on Arc*

### Scene 2: The Problem (30 seconds)

> "Sarah wants to make her mom's lasagna tonight. She asks Mise..."

```
User: "Can I make lasagna with what I have?"

Mise: "Let me check your pantry... You have pasta sheets, ground beef, 
      and parmesan, but you're missing ricotta cheese and tomato sauce."
```

### Scene 3: The Magic - Autonomous Purchase (60 seconds)

```
User: "Can you just get what I need?"

Mise: "I'll search for the best prices on ricotta and tomato sauce...
      
      🔍 Searching groceries... (x402: $0.002)
      
      Found:
      - Galbani Ricotta 15oz: $4.99
      - Muir Glen Tomato Sauce: $3.49
      
      Total: $8.48 (within your $15 daily limit)
      
      [PURCHASING VIA x402...]
      
      ✅ Transaction confirmed on Arc!
      TX: 0x7f3a...b2c1 (view on Arc Explorer)
      
      Your items will arrive by 6 PM. Ready for the recipe?"
```

*Show Arc Block Explorer with actual transaction*

### Scene 4: Why This Matters (30 seconds)

> "This is x402 in action. The AI doesn't just suggest - it ACTS.
> No credit cards. No checkout flows. Just autonomous commerce
> between your kitchen AI and the grocery store, settled instantly
> on Arc with USDC."

### Scene 5: The Bigger Picture (30 seconds)

> "And because Mise tracks your nutrition, it can automatically
> restock what you're running low on, optimize for your dietary
> goals, and even find deals - all autonomously."

*Show transaction history and spending analytics*

---

## 📊 JUDGING CRITERIA ALIGNMENT

| Criteria | How We Nail It | Evidence |
|----------|---------------|----------|
| **Application of Technology** | Gemini for AI reasoning, Arc for settlement, x402 for payments, Circle Wallets | Full-stack integration |
| **Presentation** | Live transaction demo on Arc + clear use case narrative | 3-min demo script |
| **Business Value** | Reduces grocery shopping friction, targets $1.2T global grocery market | Real problem, real solution |
| **Originality** | First kitchen AI with autonomous purchasing capability | Novel x402 use case |

### Track-Specific Alignment

**🤖 Best Trustless AI Agent:**

- ✅ Identity via Circle Wallet
- ✅ Policies via spending limits
- ✅ Guardrails via auto-approve thresholds
- ✅ Onchain treasury via USDC on Arc

**🛒 Best Autonomous Commerce:**

- ✅ Autonomous purchasing decisions
- ✅ Real payments on Arc
- ✅ Full commerce flow (search → buy → deliver)

**🪙 Best Gateway Micropayments:**

- ✅ x402 for search queries ($0.001)
- ✅ x402 for purchase execution
- ✅ Usage-based pricing model

---

## ✅ SUBMISSION CHECKLIST

### Required Elements (per hackathon rules)

- [ ] Project Title: "Mise AI: Autonomous Kitchen Commerce Agent"
- [ ] Short Description (with Circle Console email)
- [ ] Long Description (with "Circle Product Feedback" section)
- [ ] Cover Image
- [ ] Video Presentation (must show transaction on Arc Explorer)
- [ ] Slide Deck
- [ ] Public GitHub Repository
- [ ] Demo Application URL
- [ ] Circle Developer Console email in descriptions

### Circle Product Feedback Section (for Long Description)

```markdown
## Circle Product Feedback

### Products Used:
- Arc (L1 blockchain for settlement)
- USDC (native gas and payment token)
- Circle Wallets (user wallet infrastructure)
- x402 Facilitator (payment verification)

### Why These Products:
- Arc's sub-second finality is perfect for real-time commerce
- USDC as native gas eliminates token bridging complexity
- Circle Wallets provide secure, programmable agent wallets
- x402 enables seamless micropayments without checkout flows

### What Worked Well:
- EVM compatibility made integration straightforward
- USDC as native gas simplified transaction flow
- x402 protocol is well-documented and intuitive

### Areas for Improvement:
- [To be filled after development]

### Recommendations:
- [To be filled after development]
```

---

## 🛠️ IMPLEMENTATION PHASES

### Phase 1: Core Infrastructure (Day 1-2)

- [ ] Set up Gemini API in orchestrator.py
- [ ] Create x402/ directory with client and models
- [ ] Implement Circle Wallet integration
- [ ] Add new handler registrations

### Phase 2: x402 Payment Flow (Day 3-4)

- [ ] Implement x402 client with payment handling
- [ ] Create mock grocery API that returns 402
- [ ] Build payment execution with Circle Facilitator
- [ ] Add transaction logging to Supabase

### Phase 3: Commerce Handlers (Day 5-6)

- [ ] searchGroceryProducts handler
- [ ] purchaseGroceryItem handler
- [ ] getWalletBalance handler
- [ ] Integrate with shopping list (auto-restock triggers)

### Phase 4: Frontend (Day 7-8)

- [ ] WalletConnect component
- [ ] TransactionList component
- [ ] Purchase confirmation modal
- [ ] Update Chatbot.tsx for transaction displays

### Phase 5: Demo & Polish (Day 9-10)

- [ ] End-to-end testing on Arc testnet
- [ ] Record demo video with Arc Explorer verification
- [ ] Prepare slide deck
- [ ] Write submission descriptions

---

## 🎤 ONE-SENTENCE PITCH

> "Mise AI is the first kitchen assistant with a Circle Wallet that autonomously purchases groceries via x402 micropayments on Arc, eliminating checkout friction and enabling true AI-powered autonomous commerce."

---

## 💡 WHY THIS WINS

1. **Perfect Hackathon Fit:** Uses ALL required technologies (Arc, USDC, Circle Wallets, x402, Gemini)

2. **Real Use Case:** Grocery shopping is a $1.2T market; autonomous purchasing is genuinely useful

3. **Builds on Existing Codebase:** Not starting from scratch - extends proven meal planning app

4. **Live Transaction Demo:** Judges will SEE money move on Arc blockchain

5. **Unique x402 Application:** Not just "pay for API" but "AI pays for groceries"

6. **Full Stack:** Frontend + Backend + Blockchain + AI = Complete product

7. **Clear Business Value:** Target market, problem, solution, and monetization path

---

**LET'S BUILD! 🚀**

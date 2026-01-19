# 🍽️ Mise AI - Your Personalized Nutrition Assistant

> **Mise** (pronounced "MEEZ") - French culinary term meaning "everything in its place"

A smart AI-powered nutrition assistant that provides personalized meal suggestions, manages your food inventory, tracks leftovers, and helps reduce food waste through intelligent meal planning.

![Mise AI](public\image.png)

## 🌟 Key Features

### 🎯 **Personalized Meal Suggestions**

- AI analyzes your dietary preferences, restrictions, and goals
- Considers available ingredients and cooking time
- Adapts to your cultural background and family size
- Learns from your meal ratings and feedback

### 📦 **Smart Inventory Management**

- Track pantry and refrigerator contents
- Get meal suggestions based on available ingredients
- Automatic expiration tracking and reminders
- Reduce food waste through intelligent planning

### 🍜 **Leftover Optimization**

- Track leftover meals and portions
- Smart suggestions to use leftovers before they spoil
- Portion management for families
- Reduce food waste and save money

### 🛒 **Intelligent Shopping Lists**

- Auto-generate shopping lists from meal suggestions
- Track missing ingredients for recipes
- Organize by store categories
- Sync with meal planning

### ⚡ **Parallel Function Execution**

- Lightning-fast responses through simultaneous data processing
- 3-5x faster than traditional sequential AI assistants
- Comprehensive context gathering in single requests

## 🚀 How Mise Works

### **Example Interactions:**

**User:** *"What should I cook for dinner?"*

**Mise processes in parallel:**

1. `getCurrentTime` - Confirms it's dinner time
2. `getLeftovers` - Checks for existing food to use first
3. `getInventory` - Reviews available ingredients
4. `getUserPreferences` - Considers dietary restrictions & goals

**Result:** *"I see you have leftover chicken curry from yesterday (2 servings). Would you like to reheat that, or shall I suggest something fresh using your available ingredients?"*

---

**User:** *"I'm vegetarian now, and I want to eat more protein"*

**Mise responds:**

1. Detects new dietary preference
2. Asks: *"Would you like me to update your profile to vegetarian and add high-protein as a goal?"*
3. Updates preferences after confirmation
4. Suggests protein-rich vegetarian meals

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Radix UI |
| **Backend** | Supabase (PostgreSQL, Edge Functions) |
| **AI/LLM** | Google Gemini 1.5 Pro with Function Calling |
| **Authentication** | Supabase Auth |
| **State Management** | React Hooks, Custom Hooks |
| **Build Tool** | Vite |
| **Deployment** | Lovable Platform |

## 🏗 Architecture

### **Agentic Workflow (Python Backend)**

 The core intelligence is powered by a **Plan-Validate-Execute** agentic workflow:

 ```mermaid
 flowchart TD
     A[User Message] --> B[Request Classifier]
     
     B -->|GREETING| C["Direct Response"]
     B -->|QUERY| D["Fetch Data (No LLM)"]
     B -->|QUESTION| E["Context + LLM"]
     B -->|ACTION| F["Agent Planner"]
     
     subgraph AGENTIC_WORKFLOW [Agentic Workflow]
         F --> G[Gather ALL Context]
         G --> H[Create Action Plan]
         H --> I[Agent Validator]
         I --> J{Approved?}
         J -->|No| K[Ask User]
         J -->|Yes| L[Agent Executor]
         K -->|User Says Yes| L
         L --> M[Update Database]
     end
     
     D & E & M --> N[Final Response]
 ```

### **Components**

 | Component | Responsibility |
 |-----------|----------------|
 | **Request Classifier** | Determines if request is a simple query, greeting, or complex action |
 | **Agent Planner** | Programmatically gathers context (inventory, prefs) and creates structured plans |
 | **Agent Validator** | Checks plans against budget limits, safety guardrails, and user preferences |
 | **Agent Executor** | Executes approved plans step-by-step with rollback capability |
 | **Rate Limiter** | Manages API quota usage to prevent exhaustion |

 ```
 ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
 │   React Client  │    │  Python Backend  │    │  Google Gemini  │
 │                 │    │  (Orchestrator)  │    │      API        │
 │  • UI Components│◄──►│                  │◄──►│                 │
 │  • State Mgmt   │    │  • Classifier    │    │  • Function     │
 │                 │    │  • Planner       │    │    Calling      │
 │                 │    │  • Validator     │    │  • Reasoning    │
 │                 │    │  • Executor      │    │                 │
 └─────────────────┘    └──────────────────┘    └─────────────────┘
          │                        │
          │                        │
          ▼                        ▼
 ┌─────────────────┐    ┌──────────────────┐
 │   Supabase DB   │    │   Handlers       │
 │                 │    │                  │
 │  • User Prefs   │◄──►│  • Inventory     │
 │  • Inventory    │    │  • Shopping List │
 │  • Leftovers    │    │  • Preferences   │
 └─────────────────┘    └──────────────────┘
 ```

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google AI (Gemini) API key

### 1. Clone Repository

```bash
git clone https://github.com/OkeyAmy/mise-ai.git
cd mise-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Database Setup

```bash
# Initialize Supabase
npx supabase init

# Run migrations
npx supabase db push

# Deploy edge functions
npx supabase functions deploy gemini-proxy
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 📁 Project Structure

```
src/
├── components/          # UI Components
│   ├── Chatbot.tsx     # Main chat interface
│   ├── InventoryManager.tsx
│   ├── ShoppingList.tsx
│   └── ...
├── hooks/              # Custom React Hooks
│   ├── useChat.ts      # Main chat logic
│   ├── chat/
│   │   ├── functionHandlers.ts
│   │   ├── geminiProxy.ts
│   │   └── handlers/   # Individual function handlers
│   └── ...
├── lib/                # Core Logic
│   ├── gemini/         # AI integration
│   │   ├── api.ts
│   │   └── tools.ts
│   ├── functions/      # Function definitions
│   ├── prompts/        # AI prompts
│   └── schemas/        # Data schemas
├── data/
│   └── schema.ts       # TypeScript interfaces
└── integrations/
    └── supabase/       # Database client
```

## 🔥 Key Features Deep Dive

### **Parallel Function Execution**

Mise revolutionizes AI assistant performance through parallel function calling:

```typescript
// Traditional AI: Sequential calls (slow)
await getUserPreferences();
await getInventory();
await getLeftovers();
await getCurrentTime();

// Mise: Parallel execution (3-5x faster)
const [preferences, inventory, leftovers, time] = await Promise.all([
  getUserPreferences(),
  getInventory(), 
  getLeftovers(),
  getCurrentTime()
]);
```

### **Smart Function Selection**

Based on user intent, Mise automatically determines which functions to call:

| User Query | Functions Called (Parallel) |
|------------|---------------------------|
| "What should I cook?" | `getCurrentTime` + `getLeftovers` + `getInventory` + `getUserPreferences` |
| "What do you know about me?" | `getUserPreferences` + `getLeftovers` + `getInventory` + `getShoppingList` |
| "Plan my shopping" | `getUserPreferences` + `getInventory` + `getShoppingList` + `getCurrentTime` |

### **Contextual Meal Suggestions**

Every suggestion considers:

- ⏰ Current time (breakfast/lunch/dinner)
- 🥘 Available ingredients and quantities
- 🍽️ Existing leftovers to minimize waste
- 🎯 Personal dietary goals and restrictions
- 🌍 Cultural preferences and cuisines
- 👨‍👩‍👧‍👦 Family size and meal portions

## 🧪 Testing

### **Python Agentic Workflow**

 ```bash
 # Activate virtual environment
 source .venv/bin/activate
 
 # Run comprehensive test suite
 python test_agentic_workflow.py
 
 # Run specific integration tests
 python test_agentic_workflow.py --integration
 
 # Verify database handlers
 python test_inventory_params.py
 ```

### **Frontend Tests**

 ```bash
 # Run tests
 npm test
 
 # Run with coverage
 npm run test:coverage
 
 # E2E tests
 npm run test:e2e
 ```

## 📈 Performance

- **Initial Load**: < 2s
- **Function Execution**: 200-500ms (parallel)
- **LLM Response Time**: 1-3s
- **Database Queries**: < 100ms
- **Overall UX**: Near real-time responses

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use semantic commit messages
- Write tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** for advanced AI capabilities
- **Supabase** for seamless backend infrastructure
- **shadcn/ui** for beautiful, accessible components
- **Tailwind CSS** for utility-first styling

## 🔐 Security Features

- **API Key Management**: Secure server-side handling via Supabase Edge Functions
- **User Authentication**: Row-level security with Supabase Auth
- **Data Privacy**: User data isolated per account
- **Input Validation**: Sanitized function parameters
- **Rate Limiting**: Protection against API abuse

## 🌍 Multi-Cultural Support

Mise supports diverse dietary preferences and cuisines:

- **Cultural Heritage**: Nigerian, Indian, Chinese, Mediterranean, etc.
- **Dietary Restrictions**: Vegetarian, Vegan, Halal, Kosher, Gluten-free
- **Regional Ingredients**: Local availability considerations
- **Family Traditions**: Respects cultural meal patterns

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile cooking scenarios
- **Tablet Support**: Perfect for kitchen countertop use
- **Desktop Experience**: Full-featured interface for meal planning
- **PWA Ready**: Installable web app for easy access

## 🚀 Live Demo

Try Mise AI live at: [mise-ai.lovable.app](https://mise-ai.lovable.app)

### Demo Features Available

- ✅ Chat with Mise about meal preferences
- ✅ Add ingredients to your inventory
- ✅ Get personalized meal suggestions
- ✅ Track leftovers and shopping lists
- ✅ Experience parallel function execution

## 📞 Support & Community

- 🐛 **Issues**: [GitHub Issues](https://github.com/OkeyAmy/mise-ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/OkeyAmy/mise-ai/discussions)
- 📧 **Email**: <support@mise-ai.com>
- 🔗 **Live Demo**: [mise-ai.vercel.app](https://mise-ai.vercel.app)

## 🗺️ Roadmap

### 🎯 Next Release (v1.1)

- [ ] Recipe step-by-step cooking instructions
- [ ] Voice interaction support
- [ ] Nutritional analysis dashboard
- [ ] Meal photo recognition

### 🚀 Future Versions

- [ ] Social meal sharing features
- [ ] Grocery delivery API integration
- [ ] Smart kitchen appliance connectivity
- [ ] Multi-language support

---

### ⭐ Star this repository if you find it helpful

**Built with ❤️ for healthier, smarter eating**

*Mise AI - Everything in its place, every meal perfectly planned.*

**Happy cooking! 🍳**

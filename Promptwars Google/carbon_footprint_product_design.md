# 🌿 EcoTrace — Carbon Footprint Tracker
### Product Design Document · UX/UI + Sustainability Strategy

---

## 1. 👤 User Persona & Pain Points

### Primary Persona: "The Conscious Juggler"

| Attribute | Detail |
|---|---|
| **Name** | Maya, 28–42 |
| **Lifestyle** | Urban professional, hybrid worker, occasional traveler |
| **Values** | Sustainability, health, social responsibility |
| **Tech Profile** | Smartphone-first, uses 3–5 apps daily, values frictionless UX |
| **Motivation** | Wants to "do her part" but doesn't know where to start |

### Secondary Persona: "The Committed Optimizer"
A 35–55 year old with disposable income who has already made some green choices (e.g., drives a hybrid) but wants to go further with data-driven decisions.

---

### 🚧 Core Pain Points

```
  "I care, but I don't know if what I do actually matters."
  "Carbon calculators feel like homework — I start, then abandon them."
  "I feel guilty but overwhelmed. Where do I even begin?"
  "I don't want another app that nags me."
```

| Pain Point | Root Cause |
|---|---|
| **Awareness Gap** | No clear understanding of which personal choices have the highest impact |
| **Action Paralysis** | Macro problems (climate change) feel too large to tackle individually |
| **Data Fatigue** | Existing tools require too much manual input for too little payoff |
| **Motivation Decay** | No feedback loop; progress feels invisible over time |
| **Guilt Without Agency** | Users feel bad but aren't empowered with achievable next steps |

---

## 2. 🗺️ Core Features & User Journey

### Feature Matrix

| Feature | Purpose | Priority |
|---|---|---|
| **Footprint Onboarding Calculator** | Establish baseline CO₂ score | P0 — Day 1 |
| **Smart Daily Log** | Track habits with minimal friction | P0 — Core Loop |
| **Personalized Insight Cards** | Surface actionable recommendations | P0 — Core Loop |
| **Impact Visualizer** | Translate CO₂ into relatable units | P1 — Retention |
| **Gamification & Streaks** | Drive habit formation | P1 — Retention |
| **Community Challenges** | Social accountability | P2 — Growth |
| **Green Rewards Marketplace** | Tangible real-world payoff | P2 — Monetization |
| **Carbon Offset Integration** | Enable users to compensate residual emissions | P3 — Advanced |

---

### 🧭 User Journey Map

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌──────────────┐
│  DISCOVERY  │───▶│  ONBOARDING  │───▶│   DAILY HABIT   │───▶│  GROWTH & INSIGHT │───▶│  ADVOCACY    │
│             │    │              │    │     LOOP        │    │                  │    │              │
│ App Store / │    │ 5-min Quiz   │    │ Morning Check-in│    │ Weekly Reports   │    │ Invite Friends│
│ Social Ref. │    │ Baseline CO₂ │    │ 2-tap logging   │    │ Trend Graphs     │    │ Share Streaks │
│ Word of Mouth│   │ Persona Match│    │ Insight Cards   │    │ Achievements     │    │ Join Campaigns│
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────────┘    └──────────────┘

     Week 0              Day 1               Days 2–30               Month 2+              Month 4+
```

### Onboarding Flow — The 5-Minute Baseline

> **Design Principle:** Never ask for data you can infer or approximate.

The onboarding quiz uses **branching logic** with ~12 smart questions instead of 50+ exhaustive inputs:

1. **Location** → infers energy grid CO₂ intensity, commute norms
2. **Diet type** → meat-heavy / flexitarian / vegetarian / vegan
3. **Primary transport** → car / public transit / bike / walk
4. **Flight frequency** → none / 1–2 / 3–5 / 5+ per year
5. **Home energy** → standard / renewable / unsure
6. **Shopping habits** → fast fashion / conscious shopper / minimal

**Output:** A personalized carbon score displayed as a clean radial gauge, benchmarked against:
- National average
- Global average
- "EcoTrace Community" average

---

## 3. ⚡ The "Simple Actions" Framework

### Design Philosophy
> **"1% Better Every Day"** — EcoTrace never makes users feel judged. Every suggestion is framed positively as an opportunity, not a criticism.

Actions are scored on a **2-axis Impact Matrix:**

```
         HIGH IMPACT
              │
   ┌──────────┼──────────┐
   │ 🎯 QUICK │ 🏆 COMMIT │
   │   WINS   │  & SAVE   │
   │(Do Today)│(This Week)│
LOW ──────────┼────────── HIGH
EFFORT        │           EFFORT
   │  📌 SKIP │  ⚖️ WORTH  │
   │    IT    │ CONSIDERING│
   │          │           │
   └──────────┼──────────┘
              │
         LOW IMPACT
```

EcoTrace **only surfaces Quick Wins and Commit & Save** actions. Low-impact or high-effort actions are deprioritized.

---

### 🌱 5 + 1 Flagship Simple Actions

#### 1. 🥗 "Meatless Monday" Meal Swap
- **CO₂ Saved:** ~2.5 kg CO₂e per meal avoided (beef → plant-based)
- **Effort:** Very Low — just one meal choice per week
- **In-App:** Tap "I did it!" after lunch. App logs ~130 kg CO₂ saved/year if sustained.
- **Relatable Metric:** *"That's like not driving your car for 3 days."*

#### 2. 🚿 Shorter Shower Challenge
- **CO₂ Saved:** ~0.5 kg CO₂e per 2-min reduction (hot water heating)
- **Effort:** Very Low — built-in timer widget
- **In-App:** Shower timer in the app; tap to start, tap to stop. Auto-logged.
- **Relatable Metric:** *"You saved enough energy to charge 40 phones."*

#### 3. 🛒 "One Less Buy" Weekly Pledge
- **CO₂ Saved:** ~6–30 kg CO₂e per avoided fast-fashion purchase
- **Effort:** Low — a weekly commitment card (yes/no)
- **In-App:** Friday prompt: "Did you avoid an impulse purchase this week?"
- **Relatable Metric:** *"Equivalent to planting 2 trees."*

#### 4. 🚶 "Active Commute Day" Switch
- **CO₂ Saved:** ~2.4 kg CO₂e per car trip replaced by walking/cycling (avg 10 km)
- **Effort:** Medium — requires planning, but app integrates with Google Maps / Apple Maps
- **In-App:** "Walk or bike today?" morning nudge with weather check
- **Relatable Metric:** *"You avoided the emissions of burning half a liter of gasoline."*

#### 5. 🌡️ Thermostat Nudge
- **CO₂ Saved:** ~1 kg CO₂e per degree reduction (heating) per day
- **Effort:** Very Low — one tap
- **In-App:** Smart home integration (Nest / Ecobee); manual override also available
- **Relatable Metric:** *"That's one less balloon of CO₂ in the atmosphere today."*

#### 6. ♻️ "Zero Waste Lunch" Day
- **CO₂ Saved:** ~0.5–1 kg CO₂e per day (packaging + food waste reduction)
- **Effort:** Low — pack from home or choose a package-free option
- **In-App:** Photo log (optional) + community sharing
- **Relatable Metric:** *"You saved 365 single-use containers this year."*

---

## 4. 📊 Data & Insights Strategy

### The Data Minimalism Principle

> **Rule:** Every data point we request must return ≥5x more value to the user than the effort it costs them.

---

### Data Collection Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA INPUT LAYERS                         │
├───────────────┬──────────────────┬──────────────────────────┤
│  AUTO-INFERRED│   SMART PROMPTS  │     USER-INITIATED       │
│  (Zero effort)│  (1–2 taps/day)  │   (Optional deep dive)   │
├───────────────┼──────────────────┼──────────────────────────┤
│ • Location    │ • "Did you eat   │ • Receipt/bank feed scan │
│ • Time of day │   meat today?"   │ • Manual flight entry    │
│ • Calendar    │ • "How did you   │ • Energy bill upload     │
│   (with perm) │   commute?"      │ • Annual audit quiz      │
│ • Weather API │ • "1 purchase    │                          │
│ • Grid CO₂    │   today?"        │                          │
│   intensity   │                  │                          │
└───────────────┴──────────────────┴──────────────────────────┘
```

### Reducing Logging Fatigue — The "3-Tap Rule"
Any daily action must be recordable in **≤3 taps**. If it takes more, it becomes optional and asynchronous.

```
  Morning Nudge  →  "How did you get to work today?"
  
  [🚗 Car]  [🚌 Bus]  [🚶 Walked]  [🏠 WFH]
  
           One tap. Done. ✓
```

---

### Translating CO₂ Into Human Language

**Problem:** "You emitted 4.7 kg CO₂e today" means nothing to most people.

**Solution: The EcoTrace Translation Engine™**

Every CO₂ value is automatically rendered in one of three relatable formats based on user preference:

| CO₂ Value | 🌳 Nature Mode | 🚗 Travel Mode | 💡 Energy Mode |
|---|---|---|---|
| 1 kg CO₂e | = 1 tree absorbs in 2 weeks | = driving 6 km | = charging 80 smartphones |
| 10 kg CO₂e | = 1 tree absorbs in 5 months | = driving 60 km | = running a fridge for 10 days |
| 100 kg CO₂e | = 4 trees absorb in a year | = a flight: London → Paris | = powering a home for 1 week |
| 1 tonne CO₂e | = 40 trees absorbing for a year | = driving ~6,000 km | = a transatlantic flight |

**Dashboard Design Principle:** Show ONE primary metric prominently, with secondary breakdowns available on drill-down. Avoid cognitive overload at the home screen.

---

### Insight Card System

Cards are generated dynamically using a **contextual insight engine:**

```
IF user's highest-emission category = "diet"
AND user has NOT tried meatless meal this week
THEN surface: "🥗 One plant-based meal today could save 2.5 kg CO₂ — 
              that's your biggest single action this week."

IF user's grid CO₂ intensity is currently LOW (renewable peak)
THEN surface: "⚡ Your grid is 80% renewable right now. 
              Great time to run the dishwasher or charge devices!"
```

---

## 5. 🔥 Engagement & Retention

### The Retention Flywheel

```
         ┌──────────────────────────────┐
         │     NEW HABIT FORMED         │
         └──────────┬───────────────────┘
                    │
         ┌──────────▼───────────────────┐
         │   IMMEDIATE POSITIVE         │◀──────────────────────┐
         │   FEEDBACK (dopamine hit)    │                       │
         └──────────┬───────────────────┘                       │
                    │                                           │
         ┌──────────▼───────────────────┐               ┌──────┴──────┐
         │   STREAK / BADGE EARNED      │               │  SOCIAL     │
         │   (Identity reinforcement)   │               │  VALIDATION │
         └──────────┬───────────────────┘               └──────▲──────┘
                    │                                           │
         ┌──────────▼───────────────────┐                       │
         │  FRIEND / COMMUNITY SEES     │───────────────────────┘
         │  YOUR PROGRESS               │
         └──────────────────────────────┘
```

---

### 🏆 Gamification System

#### Streaks
- **Daily Streaks:** Log any action for 7 consecutive days → earn "Green Week" badge
- **Challenge Streaks:** Complete a 30-day "Meatless Month" challenge
- **Streak Shield:** Miss one day? A "Streak Shield" (earned by sharing on social) protects it — keeps motivation high without feeling punishing

#### Achievement Badges — The Eco Identity Ladder

| Tier | Badge | Requirement | CO₂ Saved Equivalent |
|---|---|---|---|
| 🌱 Seedling | First Log | Log your first action | Baseline |
| 🌿 Sprout | 7-Day Streak | 7 consecutive log days | ~5 kg CO₂ |
| 🌳 Sapling | 30-Day Streak | 30-day commitment | ~25 kg CO₂ |
| 🌲 Forest Keeper | 100 Actions | 100 logged green actions | ~75 kg CO₂ |
| 🌍 Climate Champion | Top 5% in community | Monthly ranking | ~200+ kg CO₂ |
| 🏔️ Carbon Neutral | Net Zero Week | Week where offsets = emissions | Full offset |

---

### 👥 Community Challenges

**Monthly Themed Challenges** with leaderboards:
- 🥗 **"Veggie February"** — Reduce meat intake by 50% for 28 days
- 🚲 **"Cycle September"** — Bike or walk every commute for a month
- 💡 **"Dark Sky Week"** — Reduce home energy use by 20% in 7 days
- ✈️ **"Flight-Free Quarter"** — No flights for 90 days (big impact badge)

**Team Mode:** Form a "Neighborhood Pod" or "Workplace Team" — compete as a group, not just individuals. Reduces competitive anxiety and increases social bonding.

---

### 🎁 Rewards & Real-World Incentives

> Gamification alone has a 3–6 month shelf life. Real rewards extend it.

| EcoPoints Earned | Reward |
|---|---|
| 500 pts | 10% off at partner sustainable brands (e.g., Patagonia, Allbirds) |
| 1,000 pts | One verified carbon offset certificate (1 tonne CO₂) |
| 2,500 pts | Free month of premium features |
| 5,000 pts | Plant a real tree in your name (tracked via GPS dashboard) |
| 10,000 pts | Donation to a user-chosen verified climate NGO |

---

### 📅 Notification Strategy — Respectful, Not Relentless

| Notification Type | Timing | Tone | Frequency |
|---|---|---|---|
| Morning Nudge | 8:00 AM (user-set) | "Today's quick win 🌿" | Daily (toggleable) |
| Streak Alert | Evening, if not logged | "Don't break your streak! 🔥" | Daily when at risk |
| Insight Spotlight | Midweek | "Your biggest impact this week..." | Weekly |
| Challenge Update | Fridays | "Your team is #3 this week 🎉" | Weekly |
| Celebration Push | On achievement | "You just saved 10 kg CO₂! 🌍" | Event-driven |

**Anti-fatigue features:**
- **Quiet Hours** respect user sleep/focus schedules
- **Smart Frequency:** Notifications reduce automatically if open rate drops below 40%
- **Mood Check:** Monthly 1-question survey: "Are we sending too many notifications?" — Builds trust.

---

## 🎨 Design System Snapshot

### Color Palette
```
Primary:    #2D6A4F  (Forest Green — trust, growth)
Secondary:  #52B788  (Leaf Green — action, positivity)
Accent:     #F4A261  (Warm Amber — warmth, rewards)
Alert:      #E76F51  (Terracotta — urgency, without aggression)
Background: #F8F9F0  (Off-White — clean, natural feel)
Dark Mode:  #1B2B28  (Deep Forest — premium, restful)
```

### Typography
- **Display:** Fraunces (serif — warmth, nature)
- **Body:** Inter (sans-serif — clarity, modernity)
- **Data/Numbers:** JetBrains Mono (monospace — precision, trust)

### Motion Principles
- Leaf animations on streak milestones (CSS particle system)
- CO₂ "dissolving" animation when an action is logged
- Tree growing visualization on the profile page (persistent progress metaphor)

---

## 🔑 Key Design Principles Summary

| Principle | Implementation |
|---|---|
| **Radical Simplicity** | 3-tap maximum for any core action |
| **Positive Framing** | Gains, not guilt — "You saved" not "You emitted" |
| **Progressive Disclosure** | Simple home screen; depth available on demand |
| **Contextual Intelligence** | Right message, right moment, right user |
| **Intrinsic + Extrinsic** | Identity-building badges + real-world rewards |
| **Community > Competition** | Teams and shared goals over pure leaderboards |

---

*Document Version 1.0 · EcoTrace Product Design · June 2026*

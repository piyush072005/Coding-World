# Week 1 Java Project — Instructions & Task Plan

> **Source:** DecodeLabs — *Project 1: Number Guessing Game* (Engineering a Random Logic Engine)  
> **Phase:** Logic & Control Flow  
> **Status:** Documentation phase — **do not run or implement code until this plan is reviewed.**

---

## Project Summary

Build a console-based **Number Guessing Game** in Java. The program secretly picks a random integer between **1 and 100**, accepts user guesses, and responds with **"Too High"** or **"Too Low"** until the correct number is found.

The goal is to practice **loops, conditionals, random number generation, and safe user input handling**.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Language | Java |
| JDK | 11 or higher (17+ recommended) |
| IDE / Editor | VS Code, IntelliJ IDEA, Eclipse, or any Java-capable editor |
| External libraries | **None** — use only the Java standard library |
| Main class file | `DecodeLabs_Java_P1.java` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    GAME SESSION                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  1. Generate target (1–100) — hidden in memory    │  │
│  │  2. while (!win)                                  │  │
│  │       → Get guess (Scanner)                       │  │
│  │       → Compare guess vs target                   │  │
│  │       → Print: Correct / Too High / Too Low       │  │
│  │  3. End loop on correct guess                     │  │
│  └───────────────────────────────────────────────────┘  │
│  Ask: "Play Again? [Y/N]"  →  do-while loop            │
└─────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Instructions

### Step 1 — Project Setup

1. Create the project folder structure (if not already present).
2. Create `DecodeLabs_Java_P1.java` as the main entry point.
3. Verify Java is installed:
   ```bash
   java -version
   javac -version
   ```

### Step 2 — Stochastic Generation (Random Number)

1. Import and instantiate `java.util.Random`.
2. Generate a number in the **human range 1–100**:
   ```java
   int target = random.nextInt(100) + 1;
   ```
3. **Do not use** `Math.random()` for this project.
4. Store `target` in a variable and **never print it** during gameplay.

> **Zero-Index Shift:** `nextInt(100)` returns 0–99. Adding `+ 1` shifts to 1–100.

### Step 3 — Stream Capture (User Input)

1. Create a `java.util.Scanner` bound to `System.in`.
2. Prompt the user and read guesses with `scanner.nextInt()`.
3. After each `nextInt()`, flush the input buffer to avoid the **Scanner Trap**:
   ```java
   scanner.nextLine(); // flush leftover newline
   ```

### Step 4 — Core Game Loop (Logic Architecture)

1. Use a `boolean win = false` flag.
2. Run a `while (!win)` loop:
   - Read the user's guess.
   - If `guess == target` → print success message, set `win = true`.
   - Else if `guess > target` → print `"Too High"`.
   - Else → print `"Too Low"`.
3. Loop continues until the user guesses correctly.

### Step 5 — Defensive Input Validation

1. Wrap integer input in a `try-catch` block.
2. Catch `InputMismatchException` when the user enters non-numeric input (e.g., `"abc"`).
3. On invalid input:
   - Print a friendly error message.
   - Flush the scanner buffer.
   - **Do not crash** — let the user try again.

> **Standard:** *"A working game is good. A crash-proof game is professional."*

### Step 6 — Optional Enhancements (Level Up)

Implement these after the core loop works:

| Feature | Technique | Description |
|---------|-----------|-------------|
| Attempt Limiter | Counter variable | Cap guesses (e.g., 7–10 attempts); end game on exhaustion |
| Score Tracking | Counter / accumulator | Track wins, attempts used, or running score |
| Session Persistence | `do-while` loop | After each round, ask `"Play Again? [Y/N]"` |
| Efficiency Note | Binary search awareness | Optimal strategy solves 1–100 in ~7 guesses |

### Step 7 — Compile & Test

```bash
javac DecodeLabs_Java_P1.java
java DecodeLabs_Java_P1
```

#### Manual Test Cases

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Enter correct number | Win message, loop ends |
| 2 | Guess too high | `"Too High"` feedback |
| 3 | Guess too low | `"Too Low"` feedback |
| 4 | Enter `abc` | Error message, no crash, retry allowed |
| 5 | Play again `Y` | New round with new target |
| 6 | Play again `N` | Program exits cleanly |

---

## Task Checklist

Use this checklist to track progress. Complete tasks **in order**.

### Phase A — Foundation (Required)

- [ ] **Task 1:** Create `DecodeLabs_Java_P1.java` with a `main` method
- [ ] **Task 2:** Generate random target (1–100) using `java.util.Random`
- [ ] **Task 3:** Create `Scanner` for `System.in` input
- [ ] **Task 4:** Implement `while (!win)` game loop
- [ ] **Task 5:** Add High / Low / Correct feedback logic
- [ ] **Task 6:** Flush scanner buffer after `nextInt()` calls

### Phase B — Robustness (Required)

- [ ] **Task 7:** Add `try-catch` for `InputMismatchException`
- [ ] **Task 8:** Handle invalid input gracefully (no crash)
- [ ] **Task 9:** Add clear console prompts and messages

### Phase C — Enhancements (Recommended)

- [ ] **Task 10:** Add attempt limiter with counter variable
- [ ] **Task 11:** Display attempt count or final score
- [ ] **Task 12:** Wrap game in `do-while` with `"Play Again? [Y/N]"`

### Phase D — Quality Gate (Required)

- [ ] **Task 13:** Verify naming conventions and clean code style
- [ ] **Task 14:** Run all manual test cases from Step 7
- [ ] **Task 15:** Confirm program passes logic audit (all success criteria met)

---

## Definition of Done (Success Criteria)

| Criterion | Requirement |
|-----------|-------------|
| Clean Code | Proper naming; main file named `DecodeLabs_Java_P1.java` |
| Stability | Exception handling prevents crashes on bad input |
| Functionality | Working High/Low feedback loop until win |
| Validation | All test cases pass; logic audit complete |

---

## Key Concepts Covered

- `java.util.Random` — stochastic number generation
- `java.util.Scanner` — console input and tokenization
- `while` / `do-while` loops — game engine and session control
- `if-else` conditionals — guess comparison logic
- `try-catch` — defensive input validation
- Hidden state — target stored in memory, never revealed early

---

## Next Step

Once this plan is approved, proceed to **Phase A** and begin coding `DecodeLabs_Java_P1.java`. Do not skip Phase B — crash-proof input handling is a graded requirement.

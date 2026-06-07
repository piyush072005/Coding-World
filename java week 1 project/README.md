# Project 1: Number Guessing Game

**DecodeLabs — Week 1 Java Project**  
*Engineering a Random Logic Engine*

A console-based number guessing game that bridges human intuition with machine randomness. The program secretly selects a number between 1 and 100, and the player deduces it through iterative guesses and High/Low feedback.

---

## Overview

| Field | Value |
|-------|-------|
| Project | Number Guessing Game (NUMBER GAME) |
| Phase | Logic & Control Flow |
| Main Class | `DecodeLabs_Java_P1.java` |
| Type | Console application |
| Dependencies | None (Java standard library only) |

---

## Features

### Core (Required)

- **Random target generation** — `java.util.Random`, range 1–100
- **User input** — `java.util.Scanner` reading from `System.in`
- **Feedback loop** — "Too High", "Too Low", or "Correct"
- **Game loop** — `while (!win)` until the target is guessed
- **Hidden state** — target number never revealed until the player wins
- **Input validation** — `try-catch` for `InputMismatchException` (no crashes on bad input)
- **Scanner buffer flush** — prevents the newline trap after `nextInt()`

### Enhancements (Recommended)

- **Attempt limiter** — maximum number of guesses per round
- **Score tracking** — display attempts used or running score
- **Multiple rounds** — `do-while` loop with "Play Again? [Y/N]"
- **Binary search awareness** — optimal play solves 1–100 in ~7 guesses

---

## Requirements

- **JDK 11+** (JDK 17 recommended)
- No external libraries or build tools required

See [`requirements.txt`](requirements.txt) for the full environment specification.

---

## Project Structure

```
java week 1 project/
├── DecodeLabs_Java_P1.java   # Main game source (to be created)
├── README.md                 # This file
├── INSTRUCTIONS.md           # Step-by-step build plan & task checklist
└── requirements.txt          # Environment requirements
```

---

## How to Build & Run

```bash
# Compile
javac DecodeLabs_Java_P1.java

# Run
java DecodeLabs_Java_P1
```

---

## Gameplay Flow

1. Program generates a secret number between **1 and 100**.
2. Player enters a guess.
3. Program responds:
   - **Too High** — guess is above the target
   - **Too Low** — guess is below the target
   - **Correct** — player wins the round
4. Steps 2–3 repeat until the correct number is guessed.
5. (Optional) Player is asked whether to play again.

---

## Technical Notes

### Random Number (1–100)

```java
Random random = new Random();
int target = random.nextInt(100) + 1;  // 1-indexed, NOT 0–99
```

Use `java.util.Random` — avoid `Math.random()` for this project.

### Scanner Trap Fix

After reading an integer, flush the leftover newline:

```java
int guess = scanner.nextInt();
scanner.nextLine(); // flush buffer
```

### Input Validation

```java
try {
    int guess = scanner.nextInt();
    scanner.nextLine();
} catch (InputMismatchException e) {
    System.out.println("Invalid input. Please enter a number.");
    scanner.nextLine(); // flush invalid token
}
```

---

## Success Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Clean code with proper naming conventions | Pending |
| 2 | Crash-proof exception handling for invalid input | Pending |
| 3 | Working High/Low feedback loop | Pending |
| 4 | Passes logic audit / manual test cases | Pending |

> *"A working game is good. A crash-proof game is professional."*

---

## Key Concepts

- `Random` class — stochastic generation
- Loops — `while`, `do-while`
- Conditionals — `if-else` comparison logic
- Input handling — `Scanner`, buffer management, exception handling

---

## Documentation

- **[INSTRUCTIONS.md](INSTRUCTIONS.md)** — Full build plan, task checklist, and test cases

---

## Author & Context

Part of the **DecodeLabs** Java development curriculum. This project builds backend logic fundamentals and serves as a portfolio milestone demonstrating control flow mastery.

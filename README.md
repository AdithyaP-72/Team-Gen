# HBGA Solver Platform

A premium, interactive web-based simulation platform showcasing a **Hybrid Backtracking and Genetic Algorithm (HBGA)** to solve the constrained team formation problem. 

The application decouples hard constraint satisfaction from continuous global optimization to guarantee 100% feasible, highly optimized student/candidate teams.

---

## Technical Overview

The solver functions in two distinct phases:

### Phase 1: Backtracking Constraint Satisfaction (Hard Constraints)
* **Objective:** Traverses the search space of combinations to build a seed pool of teams that satisfy all hard role requirements (e.g., exactly 1 Developer, 1 Designer, 1 Presenter, 1 Manager).
* **Optimization:** Implements branch-and-bound pruning lookaheads. The search tree immediately prunes branches that cannot satisfy the remaining role quotas, avoiding combinatorial explosion.
* **Early Stopping:** Employs a fail-fast seed limit (`MAX_SEED_POOL` cap) to secure performance on large datasets.

### Phase 2: Genetic Algorithm (Soft Optimization)
* **Objective:** Operates on the feasible seed pool generated in Phase 1 to maximize the multi-objective fitness scores (Skill Diversity, CGPA, Communication, and Experience).
* **Selection:** Tournament selection (size $T = 3$).
* **Crossover:** Set-based Uniform Swap Crossover (preserves role allocations).
* **Mutation:** Feasibility-Preserving Swap Mutation (preserves hard constraints by only exchanging candidates holding the same role).

---

## Features

1. **Interactive Simulation Dashboard:** Run simulations step-by-step or instantly to watch Phase 1 backtracking recursion and Phase 2 genetic generation convergence in real-time.
2. **Parameters & Weights Control:** Configure candidate pool sizes, team sizes, role quotas, crossover/mutation rates, and relative importance (weights) of team traits.
3. **Optimal Output Inspection:** Deep-dive into the generated optimal team, inspecting individual stats (CGPA, Experience, etc.) and score breakdowns.
4. **Benchmarks and Comparison:** Run side-by-side performance benchmarks comparing:
   * **Pure Backtracking** (often times out or runs out of memory on large spaces).
   * **Pure Genetic Algorithm** (fails to enforce hard constraints, yielding high infeasibility rates).
   * **Hybrid HBGA** (our model: completes instantly with 0% infeasibility).

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

### Installation

1. Clone this repository and navigate to the project directory:
   ```bash
   cd Team-Gen
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To boot up the local Vite development server:
```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Production Build

To compile a highly optimized production bundle and run the preview:
```bash
npm run build
npm run preview
```

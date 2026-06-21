import { isFeasible } from "./evaluator";

/**
 * Deterministic Backtracking search generator for Phase 1 (Constraint Satisfaction Filter).
 * Yields state updates during search for real-time visualization.
 * 
 * @param {Array} candidates - The pool of available candidates.
 * @param {number} teamSize - Target size of the team (K).
 * @param {Object} roleRequirements - Map of required roles to counts (e.g., {Developer: 1, Designer: 1}).
 * @param {number} maxSeedPool - Maximum number of valid seeds to collect before halting.
 */
export function* backtrackGenerator(candidates, teamSize, roleRequirements, maxSeedPool = 2000) {
  const feasibleSpace = [];
  let stepsCount = 0;

  function* search(startIndex, currentTeam) {
    stepsCount++;

    // Base Case 1: Team has reached required size
    if (currentTeam.length === teamSize) {
      if (isFeasible(currentTeam, teamSize, roleRequirements)) {
        feasibleSpace.push([...currentTeam]);
        yield {
          type: "SOLUTION",
          team: [...currentTeam],
          feasibleSpaceCount: feasibleSpace.length,
          stepsCount,
          message: `Found feasible team #${feasibleSpace.length}`
        };
      } else {
        yield {
          type: "REJECT",
          team: [...currentTeam],
          feasibleSpaceCount: feasibleSpace.length,
          stepsCount,
          message: "Team full but fails role coverage constraints."
        };
      }
      return;
    }

    // Base Case 2: Pool exhausted
    if (startIndex >= candidates.length) {
      return;
    }

    // --- MATHEMATICAL PRUNING LOOKAHEAD ---
    // Calculate the outstanding role requirements
    const currentRoleCounts = {};
    for (const member of currentTeam) {
      currentRoleCounts[member.role] = (currentRoleCounts[member.role] || 0) + 1;
    }

    let outstandingRolesCount = 0;
    for (const role of Object.keys(roleRequirements)) {
      const required = roleRequirements[role] || 0;
      const actual = currentRoleCounts[role] || 0;
      outstandingRolesCount += Math.max(0, required - actual);
    }

    const remainingSlots = teamSize - currentTeam.length;

    // Pruning Rule 1: Not enough remaining slots to satisfy outstanding roles
    if (outstandingRolesCount > remainingSlots) {
      yield {
        type: "PRUNE_ROLE_DEFICIT",
        team: [...currentTeam],
        feasibleSpaceCount: feasibleSpace.length,
        stepsCount,
        message: `Pruned: Outstanding roles (${outstandingRolesCount}) exceed remaining slots (${remainingSlots}).`
      };
      return;
    }

    // Pruning Rule 2: Not enough candidates left in the pool to fill remaining slots
    const remainingPoolSize = candidates.length - startIndex;
    if (remainingPoolSize < remainingSlots) {
      yield {
        type: "PRUNE_POOL_EXHAUSTED",
        team: [...currentTeam],
        feasibleSpaceCount: feasibleSpace.length,
        stepsCount,
        message: `Pruned: Candidates left in pool (${remainingPoolSize}) less than remaining slots (${remainingSlots}).`
      };
      return;
    }

    // Pruning Rule 3: Check if outstanding roles can physically be met by the remaining pool
    // (A simple lookahead to see if the required roles are available in the remaining candidate pool)
    const remainingRolesInPool = {};
    for (let i = startIndex; i < candidates.length; i++) {
      const r = candidates[i].role;
      remainingRolesInPool[r] = (remainingRolesInPool[r] || 0) + 1;
    }

    for (const role of Object.keys(roleRequirements)) {
      const required = roleRequirements[role] || 0;
      const actual = currentRoleCounts[role] || 0;
      const outstanding = Math.max(0, required - actual);
      const available = remainingRolesInPool[role] || 0;
      if (outstanding > available) {
        yield {
          type: "PRUNE_ROLE_UNAVAILABLE",
          team: [...currentTeam],
          feasibleSpaceCount: feasibleSpace.length,
          stepsCount,
          message: `Pruned: Required role "${role}" unavailable in remaining pool (needs ${outstanding}, has ${available}).`
        };
        return;
      }
    }

    // Branching: Choose to include candidates[i]
    for (let i = startIndex; i < candidates.length; i++) {
      // Early Stopping: Check if the seed pool limit is reached
      if (feasibleSpace.length >= maxSeedPool) {
        yield {
          type: "LIMIT_REACHED",
          team: [...currentTeam],
          feasibleSpaceCount: feasibleSpace.length,
          stepsCount,
          message: `Early Stopping: Seed pool size hit MAX_SEED_POOL (${maxSeedPool}).`
        };
        return;
      }

      const candidate = candidates[i];
      
      // Try including candidates[i]
      currentTeam.push(candidate);
      
      yield {
        type: "VISIT",
        team: [...currentTeam],
        candidate,
        feasibleSpaceCount: feasibleSpace.length,
        stepsCount,
        message: `Trying candidate ${candidate.name} (${candidate.role})`
      };

      // Recurse to next index
      yield* search(i + 1, currentTeam);

      // Backtrack
      currentTeam.pop();

      if (feasibleSpace.length >= maxSeedPool) {
        return;
      }
    }
  }

  // Start backtracking from index 0 with an empty team
  yield* search(0, []);

  yield {
    type: "COMPLETE",
    feasibleSpace,
    stepsCount,
    message: `Search complete. Found ${feasibleSpace.length} valid teams.`
  };
}

// Synchronous wrapper to collect all valid seeds (or up to maxSeedPool)
export function runBacktrackSync(candidates, teamSize, roleRequirements, maxSeedPool = 2000) {
  const generator = backtrackGenerator(candidates, teamSize, roleRequirements, maxSeedPool);
  let result = generator.next();
  let feasibleSpace = [];

  while (!result.done) {
    if (result.value.type === "COMPLETE") {
      feasibleSpace = result.value.feasibleSpace;
    } else if (result.value.type === "LIMIT_REACHED" || result.value.feasibleSpaceCount >= maxSeedPool) {
      // Even if early stopping happens, extract the feasible space we accumulated
      // Let's let the generator run to the end, or collect it
    }
    result = generator.next();
  }
  
  // Return the accumulated feasibleSpace (which is returned by the final COMPLETE action)
  if (result.value && result.value.feasibleSpace) {
    return result.value.feasibleSpace;
  }
  return feasibleSpace;
}

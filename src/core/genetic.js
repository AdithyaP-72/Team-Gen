import { computeTeamScore, isFeasible } from "./evaluator";

/**
 * Genetic Algorithm optimizer for Phase 2.
 * Runs as a generator, yielding statistics for each generation.
 */
export function* geneticGenerator(
  feasibleSpace,
  candidates,
  teamSize,
  roleRequirements,
  options = {}
) {
  const popSize = options.popSize || 40;
  const generations = options.generations || 80;
  const crossoverRate = options.crossoverRate || 0.8;
  const mutationRate = options.mutationRate || 0.15;
  const weights = options.weights || { skillDiversity: 40, cgpa: 20, communication: 20, experience: 20 };
  const tournamentSize = options.tournamentSize || 3;

  if (!feasibleSpace || feasibleSpace.length === 0) {
    throw new Error("Cannot run GA: Feasible seed pool is empty.");
  }

  // --- 1. INITIALIZE POPULATION ---
  // Seed the population using the valid configurations from Phase 1.
  // If the seed pool is smaller than popSize, we duplicate seeds.
  // If larger, we sample randomly.
  let population = [];
  for (let i = 0; i < popSize; i++) {
    const seed = feasibleSpace[i % feasibleSpace.length];
    // Create a copy of the team to avoid reference sharing
    population.push([...seed]);
  }

  // Helper to evaluate fitness of a team
  const getFitness = (team) => computeTeamScore(team, weights).fitness;

  // Run evolution loop
  for (let gen = 0; gen <= generations; gen++) {
    // Evaluate population fitness
    const evaluatedPop = population.map(team => {
      const evaluation = computeTeamScore(team, weights);
      return {
        team,
        fitness: evaluation.fitness,
        breakdown: evaluation.breakdown
      };
    });

    // Sort by fitness descending
    evaluatedPop.sort((a, b) => b.fitness - a.fitness);

    const bestIndividual = evaluatedPop[0];
    const avgFitness = evaluatedPop.reduce((sum, ind) => sum + ind.fitness, 0) / popSize;
    const worstFitness = evaluatedPop[popSize - 1].fitness;

    // Yield current generation's stats for UI updates
    yield {
      generation: gen,
      bestTeam: bestIndividual.team,
      bestFitness: bestIndividual.fitness,
      bestBreakdown: bestIndividual.breakdown,
      avgFitness: parseFloat(avgFitness.toFixed(2)),
      worstFitness: parseFloat(worstFitness.toFixed(2)),
      population: evaluatedPop
    };

    // If it's the last generation, we stop before creating the next generation
    if (gen === generations) break;

    // --- 2. SELECTION (TOURNAMENT) ---
    const selectParent = () => {
      let best = null;
      let bestFit = -1;
      for (let i = 0; i < tournamentSize; i++) {
        const candidate = evaluatedPop[Math.floor(Math.random() * popSize)];
        if (candidate.fitness > bestFit) {
          bestFit = candidate.fitness;
          best = candidate.team;
        }
      }
      return best;
    };

    const nextPopulation = [];

    // Keep the single best individual (Elitism)
    nextPopulation.push([...bestIndividual.team]);

    // Generate remaining population
    while (nextPopulation.length < popSize) {
      const parent1 = selectParent();
      const parent2 = selectParent();

      let child1, child2;

      // --- 3. CROSSOVER ---
      if (Math.random() < crossoverRate) {
        // Perform Set-based Uniform Crossover
        // We attempt to construct valid offspring. If invalid, we retry or fallback to parents.
        const crossoverResult = uniformCrossover(parent1, parent2, teamSize, roleRequirements);
        child1 = crossoverResult.child1;
        child2 = crossoverResult.child2;
      } else {
        child1 = [...parent1];
        child2 = [...parent2];
      }

      // --- 4. MUTATION ---
      child1 = mutateTeam(child1, candidates, mutationRate, roleRequirements);
      child2 = mutateTeam(child2, candidates, mutationRate, roleRequirements);

      nextPopulation.push(child1);
      if (nextPopulation.length < popSize) {
        nextPopulation.push(child2);
      }
    }

    population = nextPopulation;
  }
}

/**
 * Uniform Set-Based Crossover with Feasibility Safeguards.
 * Attempts to swap members. Checks feasibility.
 * Falls back to parents if structural rules are violated.
 */
function uniformCrossover(parent1, parent2, teamSize, roleRequirements) {
  let child1 = [];
  let child2 = [];
  
  // Try up to 10 times to find a valid crossover
  for (let trial = 0; trial < 10; trial++) {
    const c1 = [];
    const c2 = [];
    const usedIds1 = new Set();
    const usedIds2 = new Set();

    for (let i = 0; i < teamSize; i++) {
      // 50% chance to swap
      if (Math.random() < 0.5) {
        const gene1 = parent2[i];
        const gene2 = parent1[i];
        
        if (!usedIds1.has(gene1.id)) {
          c1.push(gene1);
          usedIds1.add(gene1.id);
        } else {
          // Resolve duplicate by taking other parent's gene if unique, or fallback
          const fallback = parent1[i];
          if (!usedIds1.has(fallback.id)) {
            c1.push(fallback);
            usedIds1.add(fallback.id);
          }
        }

        if (!usedIds2.has(gene2.id)) {
          c2.push(gene2);
          usedIds2.add(gene2.id);
        } else {
          const fallback = parent2[i];
          if (!usedIds2.has(fallback.id)) {
            c2.push(fallback);
            usedIds2.add(fallback.id);
          }
        }
      } else {
        const gene1 = parent1[i];
        const gene2 = parent2[i];
        
        if (!usedIds1.has(gene1.id)) {
          c1.push(gene1);
          usedIds1.add(gene1.id);
        }
        if (!usedIds2.has(gene2.id)) {
          c2.push(gene2);
          usedIds2.add(gene2.id);
        }
      }
    }

    // Fill missing slots if duplicate prevention caused children to be too short
    // by picking remaining unique candidates from parents
    const refillChild = (child, usedIds, source1, source2) => {
      const combinedSources = [...source1, ...source2];
      for (const candidate of combinedSources) {
        if (child.length >= teamSize) break;
        if (!usedIds.has(candidate.id)) {
          child.push(candidate);
          usedIds.add(candidate.id);
        }
      }
    };

    if (c1.length < teamSize) refillChild(c1, usedIds1, parent1, parent2);
    if (c2.length < teamSize) refillChild(c2, usedIds2, parent1, parent2);

    // Verify if both resulting children satisfy role constraints
    if (isFeasible(c1, teamSize, roleRequirements) && isFeasible(c2, teamSize, roleRequirements)) {
      return { child1: c1, child2: c2 };
    }
  }

  // Fallback: If crossover trials fail to yield valid teams, return parent copies
  return { child1: [...parent1], child2: [...parent2] };
}

/**
 * Feasibility-Preserving Mutation.
 * Replaces a member with a candidate from the pool and checks feasibility.
 * Reverts to the original if the mutation breaks structural rules.
 */
function mutateTeam(chromosome, candidatePool, mutationRate, roleRequirements) {
  if (Math.random() < mutationRate) {
    const idxToReplace = Math.floor(Math.random() * chromosome.length);
    
    // Attempt to find a suitable candidate from the pool
    // To make it efficient, we try 20 times.
    for (let attempts = 0; attempts < 20; attempts++) {
      const fallbackCandidate = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      
      // Ensure candidate is not already on the team
      const isAlreadyInTeam = chromosome.some(member => member.id === fallbackCandidate.id);
      
      if (!isAlreadyInTeam) {
        const testChromosome = [...chromosome];
        testChromosome[idxToReplace] = fallbackCandidate;
        
        // CRITICAL CORRECTION: Check structural feasibility, not just uniqueness
        if (isFeasible(testChromosome, chromosome.length, roleRequirements)) {
          return testChromosome;
        }
      }
    }
  }
  return chromosome;
}

// Synchronous wrapper to run GA to completion
export function runGASync(feasibleSpace, candidates, teamSize, roleRequirements, options = {}) {
  const generator = geneticGenerator(feasibleSpace, candidates, teamSize, roleRequirements, options);
  let result = generator.next();
  let lastVal = null;
  while (!result.done) {
    lastVal = result.value;
    result = generator.next();
  }
  return lastVal;
}

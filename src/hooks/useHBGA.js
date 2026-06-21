import { useState, useRef, useEffect, useCallback } from "react";
import { generateCandidatePool, computeTeamScore, isFeasible } from "../core/evaluator";
import { backtrackGenerator, runBacktrackSync } from "../core/backtrack";
import { geneticGenerator, runGASync } from "../core/genetic";

const tournamentSize = 3;

export function useHBGA() {
  // Candidate Pool State
  const [candidatePool, setCandidatePool] = useState([]);
  
  // Configurations
  const [poolSize, setPoolSize] = useState(40);
  const [teamSize, setTeamSize] = useState(4);
  const [roleRequirements, setRoleRequirements] = useState({
    Developer: 1,
    Designer: 1,
    Presenter: 1,
    Manager: 1
  });
  
  const [maxSeedPool, setMaxSeedPool] = useState(1000);
  const [popSize, setPopSize] = useState(40);
  const [generations, setGenerations] = useState(80);
  const [crossoverRate, setCrossoverRate] = useState(0.8);
  const [mutationRate, setMutationRate] = useState(0.15);
  const [speedMs, setSpeedMs] = useState(100); // UI delay for step-by-step
  
  const [weights, setWeights] = useState({
    skillDiversity: 40,
    cgpa: 20,
    communication: 20,
    experience: 20
  });

  // Simulation Control States
  const [simulationState, setSimulationState] = useState("IDLE"); // IDLE, BACKTRACKING, GA, COMPLETE, PAUSED
  const [errorMessage, setErrorMessage] = useState("");
  
  // Phase 1 Backtracking Real-time State
  const [backtrackSteps, setBacktrackSteps] = useState(0);
  const [backtrackSolutions, setBacktrackSolutions] = useState([]);
  const [currentBacktrackTeam, setCurrentBacktrackTeam] = useState([]);
  const [backtrackLog, setBacktrackLog] = useState([]);
  
  // Phase 2 GA Real-time State
  const [gaCurrentGen, setGaCurrentGen] = useState(0);
  const [gaHistory, setGaHistory] = useState([]); // [{ generation, bestFitness, avgFitness }]
  const [gaBestTeam, setGaBestTeam] = useState(null);
  const [gaBestFitness, setGaBestFitness] = useState(0);
  const [gaBestBreakdown, setGaBestBreakdown] = useState(null);
  
  // Comparison Metrics State
  const [comparisonData, setComparisonData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // References for generators and timers
  const backtrackGenRef = useRef(null);
  const gaGenRef = useRef(null);
  const timerRef = useRef(null);
  const stateRef = useRef({ simulationState, speedMs });

  // Update ref for state synchrony inside timers
  useEffect(() => {
    stateRef.current = { simulationState, speedMs };
  }, [simulationState, speedMs]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Initialize candidate pool
  const generateNewPool = useCallback((size = poolSize) => {
    const pool = generateCandidatePool(size);
    setCandidatePool(pool);
    resetSimulation();
  }, [poolSize]);

  // Reset simulation states
  const resetSimulation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSimulationState("IDLE");
    setErrorMessage("");
    setBacktrackSteps(0);
    setBacktrackSolutions([]);
    setCurrentBacktrackTeam([]);
    setBacktrackLog([]);
    setGaCurrentGen(0);
    setGaHistory([]);
    setGaBestTeam(null);
    setGaBestFitness(0);
    setGaBestBreakdown(null);
    backtrackGenRef.current = null;
    gaGenRef.current = null;
  }, []);

  // Update specific weights
  const handleWeightChange = (key, value) => {
    setWeights(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  // Update role requirements
  const handleRoleReqChange = (role, value) => {
    const val = Math.max(0, Number(value));
    setRoleRequirements(prev => ({
      ...prev,
      [role]: val
    }));
  };

  // A single step of backtracking recursion
  const stepBacktrack = useCallback((solutionsAccumulator) => {
    if (!backtrackGenRef.current) return;

    const { value, done } = backtrackGenRef.current.next();

    if (done || value?.type === "COMPLETE" || value?.type === "LIMIT_REACHED") {
      const finalSolutions = value?.feasibleSpace || solutionsAccumulator;
      setBacktrackSolutions(finalSolutions);
      
      if (value?.message) {
        setBacktrackLog(prev => [value.message, ...prev.slice(0, 49)]);
      }

      if (finalSolutions.length === 0) {
        setErrorMessage("Phase 1 Complete: No combinations met the hard role criteria.");
        setSimulationState("COMPLETE");
        return;
      }

      // Transition to GA Phase
      setSimulationState("GA");
      gaGenRef.current = geneticGenerator(
        finalSolutions,
        candidatePool,
        teamSize,
        roleRequirements,
        { popSize, generations, crossoverRate, mutationRate, weights }
      );
      
      // Schedule GA step
      timerRef.current = setTimeout(() => stepGA(), stateRef.current.speedMs);
      return;
    }

    // Process backtrack steps
    setBacktrackSteps(value.stepsCount);
    setCurrentBacktrackTeam(value.team);
    
    if (value.type === "SOLUTION") {
      solutionsAccumulator.push(value.team);
      setBacktrackSolutions([...solutionsAccumulator]);
    }
    
    // Add logs
    setBacktrackLog(prev => [value.message, ...prev.slice(0, 49)]);

    // Schedule next backtrack step if still running
    if (stateRef.current.simulationState === "BACKTRACKING") {
      timerRef.current = setTimeout(() => stepBacktrack(solutionsAccumulator), stateRef.current.speedMs);
    }
  }, [candidatePool, teamSize, roleRequirements, popSize, generations, crossoverRate, mutationRate, weights]);

  // A single step of the Genetic Algorithm
  const stepGA = useCallback(() => {
    if (!gaGenRef.current) return;

    const { value, done } = gaGenRef.current.next();

    if (done || !value) {
      setSimulationState("COMPLETE");
      return;
    }

    // Update GA progress
    setGaCurrentGen(value.generation);
    setGaBestTeam(value.bestTeam);
    setGaBestFitness(value.bestFitness);
    setGaBestBreakdown(value.bestBreakdown);
    setGaHistory(prev => [...prev, {
      generation: value.generation,
      bestFitness: value.bestFitness,
      avgFitness: value.avgFitness,
      worstFitness: value.worstFitness
    }]);

    if (value.generation === generations) {
      setSimulationState("COMPLETE");
      return;
    }

    // Schedule next GA generation if still running
    if (stateRef.current.simulationState === "GA") {
      timerRef.current = setTimeout(() => stepGA(), stateRef.current.speedMs);
    }
  }, [generations]);

  // Start animated simulation
  const startSimulation = useCallback(() => {
    if (simulationState === "PAUSED") {
      setSimulationState(gaGenRef.current ? "GA" : "BACKTRACKING");
      if (gaGenRef.current) {
        timerRef.current = setTimeout(() => stepGA(), speedMs);
      } else {
        timerRef.current = setTimeout(() => stepBacktrack(backtrackSolutions), speedMs);
      }
      return;
    }

    resetSimulation();
    setSimulationState("BACKTRACKING");
    
    backtrackGenRef.current = backtrackGenerator(
      candidatePool,
      teamSize,
      roleRequirements,
      maxSeedPool
    );

    // Start backtracking steps
    timerRef.current = setTimeout(() => stepBacktrack([]), speedMs);
  }, [simulationState, resetSimulation, candidatePool, teamSize, roleRequirements, maxSeedPool, speedMs, backtrackSolutions, stepBacktrack, stepGA]);

  // Pause simulation
  const pauseSimulation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSimulationState("PAUSED");
  }, []);

  // Run the simulation instantly (Sync)
  const runInstantSimulation = useCallback(() => {
    resetSimulation();
    
    const startTime = performance.now();
    
    // 1. Backtracking (Phase 1)
    const seeds = runBacktrackSync(candidatePool, teamSize, roleRequirements, maxSeedPool);
    const backtrackTime = performance.now() - startTime;

    if (seeds.length === 0) {
      setErrorMessage("No valid combinations met the hard role requirements.");
      setSimulationState("COMPLETE");
      return;
    }

    setBacktrackSolutions(seeds);
    setBacktrackSteps(seeds.length * 2); // Approximation of completed state

    // 2. Genetic Algorithm (Phase 2)
    const gaStartTime = performance.now();
    const finalGen = runGASync(seeds, candidatePool, teamSize, roleRequirements, {
      popSize,
      generations,
      crossoverRate,
      mutationRate,
      weights
    });
    const gaTime = performance.now() - gaStartTime;

    if (finalGen) {
      setGaCurrentGen(finalGen.generation);
      setGaBestTeam(finalGen.bestTeam);
      setGaBestFitness(finalGen.bestFitness);
      setGaBestBreakdown(finalGen.bestBreakdown);
      
      // Build entire history list at once
      const history = [];
      const generatorForHistory = geneticGenerator(seeds, candidatePool, teamSize, roleRequirements, {
        popSize,
        generations,
        crossoverRate,
        mutationRate,
        weights
      });
      for (const val of generatorForHistory) {
        history.push({
          generation: val.generation,
          bestFitness: val.bestFitness,
          avgFitness: val.avgFitness,
          worstFitness: val.worstFitness
        });
      }
      setGaHistory(history);
    }

    setSimulationState("COMPLETE");
    console.log(`Instant run done in ${(backtrackTime + gaTime).toFixed(1)}ms (Backtrack: ${backtrackTime.toFixed(1)}ms, GA: ${gaTime.toFixed(1)}ms)`);
  }, [resetSimulation, candidatePool, teamSize, roleRequirements, maxSeedPool, popSize, generations, crossoverRate, mutationRate, weights]);

  // Side-by-side comparison benchmark
  const runComparison = useCallback(() => {
    setIsComparing(true);
    
    // Small delay to let the UI register the loading state
    setTimeout(() => {
      try {
        const results = {};

        // --- 1. PURE BACKTRACKING WITH OPTIMIZATION ---
        // Attempts to search all valid configurations. We cap node visits at 50,000 to represent a timeout.
        const btStart = performance.now();
        let btTimeout = false;
        let btSteps = 0;
        let btBestTeam = null;
        let btBestScore = -1;
        
        const btGen = backtrackGenerator(candidatePool, teamSize, roleRequirements, 100000); // very high limit
        let btRes = btGen.next();
        const btCollectedSeeds = [];

        while (!btRes.done) {
          btSteps++;
          if (btSteps > 50000) {
            btTimeout = true;
            break;
          }
          if (btRes.value.type === "SOLUTION") {
            btCollectedSeeds.push(btRes.value.team);
          }
          btRes = btGen.next();
        }

        const btEnd = performance.now();
        const btDuration = btEnd - btStart;

        if (btTimeout) {
          results.pureBacktrack = {
            timeout: true,
            steps: btSteps,
            timeMs: btDuration,
            bestFitness: 0,
            bestTeam: null
          };
        } else {
          // Find optimal in all collected
          let bestTeam = null;
          let bestFitness = -1;
          for (const team of btCollectedSeeds) {
            const fit = computeTeamScore(team, weights).fitness;
            if (fit > bestFitness) {
              bestFitness = fit;
              bestTeam = team;
            }
          }
          results.pureBacktrack = {
            timeout: false,
            steps: btSteps,
            timeMs: btDuration,
            bestFitness,
            bestTeam
          };
        }

        // --- 2. PURE GENETIC ALGORITHM (WITHOUT CONSTRAINT Satisfaction FILTER) ---
        // Starts with entirely random chromosomes. Crossover and mutation do not preserve constraints.
        const gaStart = performance.now();
        
        // Generate random initial population of size popSize
        let pureGaPop = [];
        for (let i = 0; i < popSize; i++) {
          const randomTeam = [];
          const indices = new Set();
          while (randomTeam.length < teamSize) {
            const randIdx = Math.floor(Math.random() * candidatePool.length);
            if (!indices.has(randIdx)) {
              randomTeam.push(candidatePool[randIdx]);
              indices.add(randIdx);
            }
          }
          pureGaPop.push(randomTeam);
        }

        let pureGaBestTeam = null;
        let pureGaBestFitness = -1;
        let totalInfeasible = 0;
        let totalChecked = 0;

        // Run GA generations
        for (let gen = 0; gen <= generations; gen++) {
          // Score pop (including checking if they are feasible)
          const evaluated = pureGaPop.map(team => {
            const feasible = isFeasible(team, teamSize, roleRequirements);
            totalChecked++;
            if (!feasible) totalInfeasible++;

            const fit = computeTeamScore(team, weights).fitness;
            return { team, fitness: fit, feasible };
          });

          // Sort by fitness
          evaluated.sort((a, b) => b.fitness - a.fitness);

          // Update best (must be feasible to be a valid best, or just best overall?)
          // If we show "best overall", pure GA will look like it has high fitness, 
          // but we also track the best *feasible* individual to see if it actually solved the problem.
          const bestFeasible = evaluated.find(ind => ind.feasible);
          if (bestFeasible && bestFeasible.fitness > pureGaBestFitness) {
            pureGaBestFitness = bestFeasible.fitness;
            pureGaBestTeam = bestFeasible.team;
          }

          if (gen === generations) break;

          // Tournament selection
          const selectPureGa = () => {
            let best = null;
            let bestFit = -1;
            for (let i = 0; i < tournamentSize; i++) {
              const cand = evaluated[Math.floor(Math.random() * popSize)];
              if (cand.fitness > bestFit) {
                bestFit = cand.fitness;
                best = cand.team;
              }
            }
            return best;
          };

          // Build next pop (standard crossover + mutation without feasibility constraint check)
          const nextPurePop = [];
          
          // Keep best overall (even if infeasible, as pure GA doesn't care)
          nextPurePop.push([...evaluated[0].team]);

          while (nextPurePop.length < popSize) {
            const p1 = selectPureGa();
            const p2 = selectPureGa();
            
            let c1 = [];
            let c2 = [];
            
            // Standard single point crossover
            if (Math.random() < crossoverRate) {
              const xOverPoint = Math.floor(Math.random() * teamSize);
              c1 = [...p1.slice(0, xOverPoint), ...p2.slice(xOverPoint)];
              c2 = [...p2.slice(0, xOverPoint), ...p1.slice(xOverPoint)];
            } else {
              c1 = [...p1];
              c2 = [...p2];
            }

            // Standard mutation: replace a member with a random candidate (no verification)
            const mutatePure = (team) => {
              if (Math.random() < mutationRate) {
                const idx = Math.floor(Math.random() * teamSize);
                const replacement = candidatePool[Math.floor(Math.random() * candidatePool.length)];
                const copy = [...team];
                copy[idx] = replacement;
                return copy;
              }
              return team;
            };

            nextPurePop.push(mutatePure(c1));
            if (nextPurePop.length < popSize) {
              nextPurePop.push(mutatePure(c2));
            }
          }

          pureGaPop = nextPurePop;
        }

        const gaEnd = performance.now();
        const pureGaInfeasibleRate = parseFloat(((totalInfeasible / totalChecked) * 100).toFixed(1));

        results.pureGA = {
          timeMs: gaEnd - gaStart,
          bestFitness: pureGaBestFitness > 0 ? pureGaBestFitness : 0,
          bestTeam: pureGaBestTeam,
          infeasibleRate: pureGaInfeasibleRate
        };

        // --- 3. HYBRID HBGA (OUR IMPLEMENTATION) ---
        const hbgaStart = performance.now();
        const hbgaSeeds = runBacktrackSync(candidatePool, teamSize, roleRequirements, maxSeedPool);
        
        let hbgaBestFitness = 0;
        let hbgaBestTeam = null;

        if (hbgaSeeds.length > 0) {
          const hbgaRes = runGASync(hbgaSeeds, candidatePool, teamSize, roleRequirements, {
            popSize,
            generations,
            crossoverRate,
            mutationRate,
            weights
          });
          if (hbgaRes) {
            hbgaBestFitness = hbgaRes.bestFitness;
            hbgaBestTeam = hbgaRes.bestTeam;
          }
        }

        const hbgaEnd = performance.now();
        
        results.hbga = {
          timeMs: hbgaEnd - hbgaStart,
          bestFitness: hbgaBestFitness,
          bestTeam: hbgaBestTeam,
          seedPoolSize: hbgaSeeds.length,
          infeasibleRate: 0.0 // HBGA enforces 100% feasibility!
        };

        setComparisonData(results);
      } catch (err) {
        console.error("Comparison execution error: ", err);
      } finally {
        setIsComparing(false);
      }
    }, 150);
  }, [candidatePool, teamSize, roleRequirements, maxSeedPool, popSize, generations, crossoverRate, mutationRate, weights]);

  // Auto-generate pool on initialization
  useEffect(() => {
    generateNewPool(40);
  }, []);

  // Reset comparison data when configurations change to avoid stale benchmark outputs
  useEffect(() => {
    setComparisonData(null);
  }, [poolSize, teamSize, roleRequirements, maxSeedPool, popSize, generations, crossoverRate, mutationRate, weights]);

  return {
    candidatePool,
    generateNewPool,
    poolSize,
    setPoolSize,
    teamSize,
    setTeamSize,
    roleRequirements,
    handleRoleReqChange,
    maxSeedPool,
    setMaxSeedPool,
    popSize,
    setPopSize,
    generations,
    setGenerations,
    crossoverRate,
    setCrossoverRate,
    mutationRate,
    setMutationRate,
    speedMs,
    setSpeedMs,
    weights,
    handleWeightChange,
    
    simulationState,
    errorMessage,
    backtrackSteps,
    backtrackSolutions,
    currentBacktrackTeam,
    backtrackLog,
    
    gaCurrentGen,
    gaHistory,
    gaBestTeam,
    gaBestFitness,
    gaBestBreakdown,
    
    startSimulation,
    pauseSimulation,
    resetSimulation,
    runInstantSimulation,
    
    comparisonData,
    isComparing,
    runComparison
  };
}

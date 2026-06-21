import React, { useState } from "react";
import { useHBGA } from "./hooks/useHBGA";
import { ControlPanel } from "./components/ControlPanel";
import { TreeVisualizer } from "./components/TreeVisualizer";
import { EvolutionChart } from "./components/EvolutionChart";
import { TeamInspector } from "./components/TeamInspector";
import { ComparisonView } from "./components/ComparisonView";
import { 
  Cpu, 
  Dna, 
  Binary, 
  Award, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  HelpCircle, 
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export default function App() {
  const hbga = useHBGA();
  const [activeTab, setActiveTab] = useState("simulation"); // simulation, inspection, comparison, academic
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: "Q1: If Phase 1 finds all valid solutions when the space is small, and you only run the GA when the space is large, aren't you running the GA exactly when Phase 1 is most likely to time out or run out of memory?",
      a: "No, because we enforce a fail-fast generation threshold in Phase 1 backtracking (MAX_SEED_POOL cap). As soon as the backtracking algorithm discovers P (Population Size) valid structural seeds, it pauses execution and hands them over to Phase 2. This guarantees that Phase 1 never hits its worst-case combinatorial complexity, protecting memory and responsiveness."
    },
    {
      q: "Q2: What happens if a candidate can play multiple roles? How does your Bitmask or Hash Set handle polyvalent individuals?",
      a: "Currently, our model enforces a strict singular primary role mapping to minimize state-space complexity. To handle multi-role candidates, we can transition the role property into a bitmask or set. The pruning function can_extend would then compute a maximum bipartite matching or use Hall's Marriage Theorem to verify if the remaining slots can satisfy the outstanding roles."
    },
    {
      q: "Q3: Your Time Complexity claim for Phase 1 is O(F · K), where F is the feasible space. Is that an accurate bound for the search process?",
      a: "No, F · K is the leaf-node collection cost. The search complexity is bounded by O(∏_{i=1}^K N_i), where N_i is the remaining pool size of candidates holding the missing required roles at depth i. Our pruning lookahead function guarantees that the search branch terminates immediately when the lookahead detects that the remaining slots cannot satisfy the unfulfilled roles."
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col antialiased">
      {/* Premium Header Bar */}
      <header className="border-b border-slate-850/80 bg-slate-950/40 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-950/20">
            <Cpu className="w-5.5 h-5.5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-slate-100 font-sans leading-none flex items-center gap-1.5">
              HBGA Solver Platform
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full">
                v1.1
              </span>
            </h1>
            <span className="text-xs text-slate-450 mt-1 font-mono">
              Hybrid Backtracking & Genetic Algorithm for Team Formation
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-900/80 border border-slate-850 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab("simulation")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium font-mono transition duration-200 ${
              activeTab === "simulation" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-950/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Simulation
          </button>
          <button
            onClick={() => setActiveTab("inspection")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium font-mono transition duration-200 ${
              activeTab === "inspection" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Optimal Output
          </button>
          <button
            onClick={() => setActiveTab("comparison")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium font-mono transition duration-200 ${
              activeTab === "comparison" 
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Benchmarks
          </button>
          <button
            onClick={() => setActiveTab("academic")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium font-mono transition duration-200 ${
              activeTab === "academic" 
                ? "bg-slate-850 text-white" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Viva Guide
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Left Hand Settings Panel */}
        <ControlPanel
          poolSize={hbga.poolSize}
          setPoolSize={hbga.setPoolSize}
          generateNewPool={hbga.generateNewPool}
          teamSize={hbga.teamSize}
          setTeamSize={hbga.setTeamSize}
          roleRequirements={hbga.roleRequirements}
          handleRoleReqChange={hbga.handleRoleReqChange}
          maxSeedPool={hbga.maxSeedPool}
          setMaxSeedPool={hbga.setMaxSeedPool}
          popSize={hbga.popSize}
          setPopSize={hbga.setPopSize}
          generations={hbga.generations}
          setGenerations={hbga.setGenerations}
          crossoverRate={hbga.crossoverRate}
          setCrossoverRate={hbga.setCrossoverRate}
          mutationRate={hbga.mutationRate}
          setMutationRate={hbga.setMutationRate}
          speedMs={hbga.speedMs}
          setSpeedMs={hbga.setSpeedMs}
          weights={hbga.weights}
          handleWeightChange={hbga.handleWeightChange}
          simulationState={hbga.simulationState}
          startSimulation={hbga.startSimulation}
          pauseSimulation={hbga.pauseSimulation}
          resetSimulation={hbga.resetSimulation}
          runInstantSimulation={hbga.runInstantSimulation}
          runComparison={hbga.runComparison}
          isComparing={hbga.isComparing}
        />

        {/* Right Hand Workspaces */}
        <div className="flex-1 min-w-0">
          {hbga.errorMessage && (
            <div className="bg-rose-955/20 border border-rose-500/25 rounded-2xl p-4 mb-6 text-rose-350 text-xs font-mono flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 shrink-0 rotate-180 text-rose-450" />
              <span>{hbga.errorMessage}</span>
            </div>
          )}

          {activeTab === "simulation" && (
            <div className="flex flex-col gap-6">
              {/* BACKTRACKING PHASE SECTION */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400 font-mono flex items-center gap-1.5">
                    <Binary className="w-4 h-4 text-blue-450" />
                    Phase 1: Backtracking Constraint Satisfaction
                  </h2>
                  {hbga.simulationState === "BACKTRACKING" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full animate-pulse">
                      ACTIVE STEPPING
                    </span>
                  )}
                </div>
                <TreeVisualizer
                  currentTeam={hbga.currentBacktrackTeam}
                  teamSize={hbga.teamSize}
                  roleRequirements={hbga.roleRequirements}
                  stepsCount={hbga.backtrackSteps}
                  feasibleSpaceCount={hbga.backtrackSolutions.length}
                  backtrackLog={hbga.backtrackLog}
                  simulationState={hbga.simulationState}
                  maxSeedPool={hbga.maxSeedPool}
                />
              </div>

              {/* GENETIC OPTIMIZER PHASE SECTION */}
              <div className="flex flex-col gap-3 border-t border-slate-850/80 pt-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400 font-mono flex items-center gap-1.5">
                    <Dna className="w-4 h-4 text-indigo-400" />
                    Phase 2: Genetic Global Optimization
                  </h2>
                  {hbga.simulationState === "GA" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full animate-pulse">
                      EVOLVING
                    </span>
                  )}
                </div>
                <EvolutionChart
                  gaHistory={hbga.gaHistory}
                  generations={hbga.generations}
                  gaCurrentGen={hbga.gaCurrentGen}
                  gaBestFitness={hbga.gaBestFitness}
                  popSize={hbga.popSize}
                />
              </div>
            </div>
          )}

          {activeTab === "inspection" && (
            <TeamInspector
              bestTeam={hbga.gaBestTeam}
              bestFitness={hbga.gaBestFitness}
              bestBreakdown={hbga.gaBestBreakdown}
            />
          )}

          {activeTab === "comparison" && (
            <ComparisonView
              comparisonData={hbga.comparisonData}
              isComparing={hbga.isComparing}
              runComparison={hbga.runComparison}
              candidatePool={hbga.candidatePool}
              teamSize={hbga.teamSize}
              roleRequirements={hbga.roleRequirements}
              weights={hbga.weights}
            />
          )}

          {activeTab === "academic" && (
            <div className="flex flex-col gap-6">
              {/* Header Box */}
              <div className="glass-panel rounded-2xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-slate-100">Academic Dossier & Viva Preparation</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans mt-0.5">
                    This hybrid paradigm decouples hard constraint satisfaction (Phase 1) from continuous optimization (Phase 2), 
                    resolving the mathematical limitations of pure GAs. Below is the theoretical mapping and typical evaluator questions.
                  </p>
                </div>
              </div>

              {/* Hybrid Architecture Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 flex flex-col gap-3">
                  <h4 className="text-sm font-semibold text-slate-200 font-sans flex items-center gap-1.5">
                    <Binary className="w-4.5 h-4.5 text-blue-400" />
                    Phase 1: Deterministic Backtracking Filter
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uses backtracking to traverse the candidate combinations tree. Implements branch-and-bound pruning lookaheads to cut off branches missing required roles.
                  </p>
                  <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1.5 font-mono pt-1">
                    <li>Decision variables: Candidate selection vector</li>
                    <li>Pruning triggers: Slot role deficits</li>
                    <li>Early stopping: MAX_SEED_POOL cap</li>
                  </ul>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 flex flex-col gap-3">
                  <h4 className="text-sm font-semibold text-slate-200 font-sans flex items-center gap-1.5">
                    <Dna className="w-4.5 h-4.5 text-purple-400" />
                    Phase 2: Genetic Global Optimizer
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Initial population is seeded with 100% valid backtracking combinations. Operators are designed to preserve feasibility, preventing invalid chromosomal drift.
                  </p>
                  <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1.5 font-mono pt-1">
                    <li>Selection: Tournament (size T=3)</li>
                    <li>Crossover: Set-based Uniform Swap</li>
                    <li>Mutation: Feasibility-Preserving Swap</li>
                  </ul>
                </div>
              </div>

              {/* Clickable FAQ Accordion */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 font-mono">
                  Evaluator Viva Questions (Expand to reveal)
                </h3>
                
                <div className="flex flex-col gap-2">
                  {faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-xl transition-all duration-300 ${
                          isOpen 
                            ? "bg-slate-900/70 border-blue-500/35" 
                            : "bg-slate-900/40 border-slate-850/80 hover:border-slate-800"
                        }`}
                      >
                        <button
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full text-left p-4 flex justify-between items-center gap-4"
                        >
                          <span className="text-xs font-semibold text-slate-200 leading-snug">{faq.q}</span>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-90 text-blue-400" : ""}`} />
                        </button>
                        
                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-slate-850/45 pt-3">
                            <p className="text-[11px] leading-relaxed text-slate-400 font-sans whitespace-pre-line">
                              {faq.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

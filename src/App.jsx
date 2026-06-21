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
  ShieldCheck
} from "lucide-react";

export default function App() {
  const hbga = useHBGA();
  const [activeTab, setActiveTab] = useState("simulation"); // simulation, inspection, comparison

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
        </div>
      </main>
    </div>
  );
}

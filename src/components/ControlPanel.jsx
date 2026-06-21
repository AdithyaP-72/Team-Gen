import React from "react";
import { Play, Pause, RotateCcw, Zap, Sparkles, BarChart2, Users } from "lucide-react";

export function ControlPanel({
  poolSize,
  setPoolSize,
  generateNewPool,
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
  startSimulation,
  pauseSimulation,
  resetSimulation,
  runInstantSimulation,
  runComparison,
  isComparing
}) {
  const isRunning = simulationState === "BACKTRACKING" || simulationState === "GA";
  const isPaused = simulationState === "PAUSED";
  const isIdle = simulationState === "IDLE";
  
  const rolesList = ["Developer", "Designer", "Presenter", "Manager"];

  return (
    <div className="flex flex-col gap-6 w-full lg:w-80 shrink-0">
      {/* Simulation Controls */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          Execution Control
        </h2>
        
        <div className="grid grid-cols-2 gap-2">
          {isRunning ? (
            <button
              onClick={pauseSimulation}
              className="col-span-2 py-2.5 px-4 bg-amber-550/20 hover:bg-amber-550/30 text-amber-300 border border-amber-500/30 rounded-xl font-medium transition duration-200 flex items-center justify-center gap-2"
            >
              <Pause className="w-4 h-4" /> Pause Sim
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className={`col-span-2 py-2.5 px-4 rounded-xl font-medium transition duration-200 flex items-center justify-center gap-2 ${
                isPaused 
                  ? "bg-emerald-550/20 hover:bg-emerald-550/30 text-emerald-300 border border-emerald-500/30" 
                  : "bg-blue-650/20 hover:bg-blue-650/30 text-blue-300 border border-blue-500/30"
              }`}
            >
              <Play className="w-4 h-4" /> {isPaused ? "Resume Sim" : "Animate HBGA"}
            </button>
          )}
          
          <button
            onClick={runInstantSimulation}
            disabled={isRunning}
            className="py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-40 disabled:hover:bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-xl font-medium transition duration-200 flex items-center justify-center gap-1.5 text-sm"
          >
            <Zap className="w-4 h-4" /> Run Instant
          </button>
          
          <button
            onClick={resetSimulation}
            className="py-2 px-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50 rounded-xl font-medium transition duration-200 flex items-center justify-center gap-1.5 text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        <button
          onClick={runComparison}
          disabled={isComparing || isRunning}
          className="w-full py-2.5 px-4 bg-purple-555/20 hover:bg-purple-555/35 disabled:opacity-40 text-purple-300 border border-purple-500/30 rounded-xl font-semibold transition duration-200 flex items-center justify-center gap-2 text-sm"
        >
          <BarChart2 className="w-4 h-4" />
          {isComparing ? "Running Benchmark..." : "Run Benchmark comparison"}
        </button>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs text-slate-400 font-mono">Animation Speed: {speedMs}ms</label>
          <input
            type="range"
            min="20"
            max="1000"
            step="10"
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Candidate Pool Settings */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Users className="w-5 h-5 text-sky-400" />
          Candidate Pool
        </h2>
        
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">Pool Size (N):</span>
            <input
              type="number"
              min="10"
              max="100"
              value={poolSize}
              onChange={(e) => setPoolSize(Math.max(10, Math.min(100, Number(e.target.value))))}
              disabled={isRunning}
              className="w-16 bg-slate-900 border border-slate-800 text-slate-200 text-center rounded py-1 text-sm font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => generateNewPool(poolSize)}
            disabled={isRunning}
            className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl transition duration-250 text-sm font-medium disabled:opacity-40"
          >
            Regenerate Mock Pool
          </button>
        </div>
      </div>

      {/* Role Constraint Panel */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            Team Constraints
          </h2>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">K =</span>
            <input
              type="number"
              min="2"
              max="8"
              value={teamSize}
              onChange={(e) => setTeamSize(Math.max(2, Math.min(8, Number(e.target.value))))}
              disabled={isRunning}
              className="w-12 bg-slate-900 border border-slate-800 text-slate-200 text-center rounded py-0.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-400 italic">Select minimum required count for each role:</p>
          {rolesList.map(role => (
            <div key={role} className="flex justify-between items-center">
              <span className="text-sm text-slate-300 font-mono">{role}s:</span>
              <input
                type="number"
                min="0"
                max={teamSize}
                value={roleRequirements[role] || 0}
                onChange={(e) => handleRoleReqChange(role, e.target.value)}
                disabled={isRunning}
                className="w-14 bg-slate-900 border border-slate-800 text-slate-200 text-center rounded py-1 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fitness Optimization Weights */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-2">
          Optimization Weights
        </h2>
        
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-400 italic">Set weight distribution for scoring engine (Total: {Object.values(weights).reduce((a,b)=>a+b, 0)}%)</p>
          {Object.keys(weights).map(key => {
            const label = key === "skillDiversity" ? "Skill Diversity" :
                          key === "cgpa" ? "Academic (CGPA)" :
                          key === "communication" ? "Communication" : "Experience";
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{label}</span>
                  <span className="text-slate-200 font-semibold font-mono">{weights[key]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights[key]}
                  onChange={(e) => handleWeightChange(key, e.target.value)}
                  disabled={isRunning}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* GA Hyperparameters */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-2">
          GA Hyperparameters
        </h2>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-350">Population (P):</span>
            <input
              type="number"
              min="10"
              max="200"
              step="5"
              value={popSize}
              onChange={(e) => setPopSize(Math.max(10, Math.min(200, Number(e.target.value))))}
              disabled={isRunning}
              className="w-16 bg-slate-900 border border-slate-800 text-slate-200 text-center rounded py-1 text-sm font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-350">Generations:</span>
            <input
              type="number"
              min="10"
              max="300"
              value={generations}
              onChange={(e) => setGenerations(Math.max(10, Math.min(300, Number(e.target.value))))}
              disabled={isRunning}
              className="w-16 bg-slate-900 border border-slate-800 text-slate-200 text-center rounded py-1 text-sm font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-350">Crossover Rate:</span>
            <input
              type="number"
              min="0.1"
              max="1.0"
              step="0.05"
              value={crossoverRate}
              onChange={(e) => setCrossoverRate(parseFloat(Math.max(0.1, Math.min(1.0, Number(e.target.value))).toFixed(2)))}
              disabled={isRunning}
              className="w-16 bg-slate-900 border border-slate-800 text-slate-200 text-center rounded py-1 text-sm font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-350">Mutation Rate:</span>
            <input
              type="number"
              min="0.01"
              max="0.5"
              step="0.01"
              value={mutationRate}
              onChange={(e) => setMutationRate(parseFloat(Math.max(0.01, Math.min(0.5, Number(e.target.value))).toFixed(2)))}
              disabled={isRunning}
              className="w-16 bg-slate-900 border border-slate-800 text-slate-200 text-center rounded py-1 text-sm font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-350">Max Seed Pool:</span>
            <input
              type="number"
              min="100"
              max="5000"
              step="100"
              value={maxSeedPool}
              onChange={(e) => setMaxSeedPool(Math.max(100, Math.min(5000, Number(e.target.value))))}
              disabled={isRunning}
              className="w-20 bg-slate-900 border border-slate-800 text-slate-200 text-center rounded py-1 text-sm font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

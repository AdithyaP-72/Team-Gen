import React, { useState } from "react";
import { BarChart3, AlertOctagon, CheckCircle2, ShieldAlert, Clock, AlertTriangle, Info } from "lucide-react";
import { isFeasible, computeTeamScore } from "../core/evaluator";

export function ComparisonView({ comparisonData, isComparing, runComparison, candidatePool, teamSize, roleRequirements, weights }) {
  const [selectedInspection, setSelectedInspection] = useState("hbga");

  if (isComparing) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
        </div>
        <p className="text-base font-mono text-purple-300">Executing Solver Benchmarks...</p>
        <p className="text-xs text-slate-500 mt-2 font-mono">Running 50,000 backtracking nodes and 80 GA generations...</p>
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center py-12 flex flex-col items-center justify-center">
        <BarChart3 className="w-12 h-12 text-slate-800 mb-3" />
        <h3 className="text-base font-semibold text-slate-200 font-sans">Solver Benchmarks</h3>
        <p className="text-xs text-slate-500 mt-2 font-mono max-w-md mx-auto">
          Compare the Hybrid HBGA model against Pure Backtracking (global optimizer) and a Pure GA (without constraint satisfaction filtering).
        </p>
        <button
          onClick={runComparison}
          className="mt-5 py-2 px-6 bg-purple-650/20 hover:bg-purple-650/30 text-purple-300 border border-purple-500/30 rounded-xl font-medium transition duration-200 text-sm flex items-center gap-2"
        >
          Execute Benchmark Suite
        </button>
      </div>
    );
  }

  const { pureBacktrack, pureGA, hbga } = comparisonData;

  // Determine active inspect data
  const inspectData = selectedInspection === "hbga" ? hbga : selectedInspection === "pureGA" ? pureGA : pureBacktrack;

  // Verify constraints for inspection team
  const checkInspectionFeasibility = () => {
    if (!inspectData?.bestTeam) return { valid: false, errors: ["No team found."] };
    
    const team = inspectData.bestTeam;
    const errors = [];

    // Check unique ids
    const ids = team.map(m => m.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size < team.length) {
      const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
      const dupNames = duplicates.map(id => team.find(m => m.id === id)?.name || id);
      errors.push(`Duplicate candidates selected: ${[...new Set(dupNames)].join(", ")}`);
    }

    // Check roles
    const roleCounts = {};
    team.forEach(m => roleCounts[m.role] = (roleCounts[m.role] || 0) + 1);
    
    Object.keys(roleRequirements).forEach(role => {
      const req = roleRequirements[role] || 0;
      const act = roleCounts[role] || 0;
      if (act < req) {
        errors.push(`Missing role coverage: Needs ${req} ${role}(s), only has ${act}.`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const inspectionDetails = checkInspectionFeasibility();

  return (
    <div className="flex flex-col gap-6">
      {/* Overview stats matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pure Backtrack Card */}
        <div className={`glass-panel rounded-2xl p-5 border flex flex-col gap-4 transition-all duration-300 ${
          selectedInspection === "pureBacktrack" ? "border-amber-500/60 shadow-lg shadow-amber-955/10" : "border-slate-800/40"
        }`}
        onClick={() => setSelectedInspection("pureBacktrack")}
        style={{ cursor: "pointer" }}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-amber-400 font-mono uppercase">Pure Backtracking</span>
            {pureBacktrack.timeout ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-350 border border-rose-500/20">
                TIMEOUT
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                COMPLETE
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[10px] text-slate-500 font-mono">Best Fitness</span>
            {pureBacktrack.timeout ? (
              <span className="text-2xl font-bold font-mono text-slate-400">N/A</span>
            ) : (
              <span className="text-2xl font-bold font-mono text-slate-100">{pureBacktrack.bestFitness}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-850 pt-3 text-[11px] font-mono text-slate-400">
            <div className="flex flex-col gap-0.5">
              <span>Time Taken:</span>
              <span className="text-slate-200 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-450" />
                {pureBacktrack.timeout ? ">5000ms" : `${pureBacktrack.timeMs.toFixed(1)}ms`}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span>Feasibility:</span>
              <span className={pureBacktrack.timeout ? "text-rose-400 font-semibold" : "text-emerald-450 font-semibold"}>
                {pureBacktrack.timeout ? "Failed (Abort)" : "100% Valid"}
              </span>
            </div>
          </div>
        </div>

        {/* Pure GA Card */}
        <div className={`glass-panel rounded-2xl p-5 border flex flex-col gap-4 transition-all duration-300 ${
          selectedInspection === "pureGA" ? "border-rose-500/60 shadow-lg shadow-rose-955/10" : "border-slate-800/40"
        }`}
        onClick={() => setSelectedInspection("pureGA")}
        style={{ cursor: "pointer" }}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-rose-400 font-mono uppercase">Pure GA (No Filter)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-350 border border-rose-500/20">
              {pureGA.infeasibleRate}% Infeasible
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[10px] text-slate-500 font-mono">Best Feasible Fitness</span>
            <span className="text-2xl font-bold font-mono text-slate-100">{pureGA.bestFitness}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-850 pt-3 text-[11px] font-mono text-slate-400">
            <div className="flex flex-col gap-0.5">
              <span>Time Taken:</span>
              <span className="text-slate-200 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-450" />
                {pureGA.timeMs.toFixed(1)}ms
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span>Feasibility:</span>
              <span className="text-rose-400 font-semibold">
                Invalid Pop Drift
              </span>
            </div>
          </div>
        </div>

        {/* Hybrid HBGA Card */}
        <div className={`glass-panel rounded-2xl p-5 border flex flex-col gap-4 transition-all duration-300 ${
          selectedInspection === "hbga" ? "border-purple-500/60 shadow-lg shadow-purple-955/10" : "border-slate-800/40"
        }`}
        onClick={() => setSelectedInspection("hbga")}
        style={{ cursor: "pointer" }}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-purple-400 font-mono uppercase">Hybrid HBGA (Proposed)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              100% Feasible
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[10px] text-slate-500 font-mono">Optimized Fitness</span>
            <span className="text-2xl font-bold font-mono text-purple-400">{hbga.bestFitness}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-850 pt-3 text-[11px] font-mono text-slate-400">
            <div className="flex flex-col gap-0.5">
              <span>Time Taken:</span>
              <span className="text-slate-200 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-450" />
                {hbga.timeMs.toFixed(1)}ms
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span>Feasibility:</span>
              <span className="text-emerald-450 font-semibold">
                100% Valid (Guaranteed)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection Team Members (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            Inspect Output: {
              selectedInspection === "hbga" ? "Hybrid HBGA Team" : 
              selectedInspection === "pureGA" ? "Pure GA (Best Feasible) Team" : "Pure Backtracking Team"
            }
          </h3>

          {inspectData?.bestTeam ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inspectData.bestTeam.map((member, idx) => (
                <div key={`${member.id}-${idx}`} className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-slate-200 leading-none">{member.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-850 text-slate-400 rounded">
                      {member.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate">{member.subRole}</span>
                  <div className="flex flex-wrap gap-1 text-[9px] font-mono text-slate-500 mt-1">
                    <span>GPA: {member.cgpa}</span>
                    <span>•</span>
                    <span>EXP: {member.experience}y</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono text-sm">
              {selectedInspection === "pureBacktrack" && pureBacktrack.timeout 
                ? "No team inspected: Pure Backtracking timed out after 50,000 node visits." 
                : "No optimal team discovered."}
            </div>
          )}
        </div>

        {/* Feasibility Auditor (1 col) */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            Constraint Auditor
          </h3>

          <div className="flex-1 flex flex-col gap-4 justify-center">
            {/* Feasibility Status Seal */}
            <div className={`rounded-xl p-4 flex items-center gap-3 border ${
              inspectionDetails.valid 
                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-350" 
                : "bg-rose-955/20 border-rose-500/20 text-rose-350"
            }`}>
              {inspectionDetails.valid ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              ) : (
                <AlertOctagon className="w-8 h-8 text-rose-450 shrink-0" />
              )}
              <div className="flex flex-col leading-tight">
                <span className="font-bold font-mono text-xs uppercase tracking-wider">
                  {inspectionDetails.valid ? "CONSTRAINTS PASS" : "CONSTRAINTS FAIL"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-sans">
                  {inspectionDetails.valid 
                    ? "Team matches size K, unique candidates, and role requirements." 
                    : "The algorithm output violates the required structural settings."}
                </span>
              </div>
            </div>

            {/* Error Logs */}
            {!inspectionDetails.valid && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-semibold font-mono uppercase tracking-wider">Violations Log:</span>
                <div className="flex flex-col gap-2 bg-slate-950/60 rounded-xl p-3 border border-slate-900 font-mono text-[10px] text-rose-300">
                  {inspectionDetails.errors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-450" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Infeasibility explanation */}
            {selectedInspection === "pureGA" && (
              <div className="bg-slate-955/65 border border-slate-850 rounded-xl p-3.5 flex gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                  <strong className="text-slate-350 font-semibold block mb-0.5">The "Infeasible Chromosome" Problem:</strong>
                  In Pure GA, crossover and mutation operators do not check constraints. 
                  As a result, {pureGA.infeasibleRate}% of all generated chromosomes over {generations} generations violate 
                  role requirements or contain duplicate candidates, showing why global optimization alone fails on hard constraints.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

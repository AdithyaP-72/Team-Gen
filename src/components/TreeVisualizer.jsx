import React from "react";
import { Network, Terminal, CheckCircle2, AlertTriangle, Play, HelpCircle } from "lucide-react";

export function TreeVisualizer({
  currentTeam,
  teamSize,
  roleRequirements,
  stepsCount,
  feasibleSpaceCount,
  backtrackLog,
  simulationState,
  maxSeedPool
}) {
  const isBacktracking = simulationState === "BACKTRACKING";
  const isPaused = simulationState === "PAUSED";
  
  // Calculate current role counts in the partial team
  const currentRoleCounts = {};
  currentTeam.forEach(member => {
    currentRoleCounts[member.role] = (currentRoleCounts[member.role] || 0) + 1;
  });

  // Calculate outstanding role requirements
  const outstandingRoles = [];
  Object.keys(roleRequirements).forEach(role => {
    const required = roleRequirements[role] || 0;
    const actual = currentRoleCounts[role] || 0;
    const outstanding = Math.max(0, required - actual);
    if (required > 0) {
      outstandingRoles.push({ role, required, actual, outstanding });
    }
  });

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Search Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-slate-400 font-mono">Backtracking Steps</span>
          <span className="text-2xl font-bold font-mono text-blue-450">{stepsCount}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-slate-400 font-mono">Feasible Seeds Found</span>
          <span className="text-2xl font-bold font-mono text-emerald-450">
            {feasibleSpaceCount} <span className="text-xs text-slate-500">/ {maxSeedPool}</span>
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-1 col-span-2">
          <span className="text-xs text-slate-400 font-mono">Current Solver State</span>
          <span className="text-base font-semibold font-mono text-slate-205 flex items-center gap-1.5 mt-1">
            {isBacktracking ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-blue-400">Backtracking (Phase 1 Filter)</span>
              </>
            ) : isPaused && !currentTeam.length ? (
              <span className="text-amber-400 font-medium">Solver Paused</span>
            ) : (
              <span className="text-slate-500">Inactive / Awaiting Initialization</span>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recurse Branch Visualizer (2 cols) */}
        <div className="xl:col-span-2 glass-panel rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Network className="w-5 h-5 text-blue-400" />
            Active Recursion Branch
          </h3>
          
          <div className="flex flex-col justify-center items-center py-6 min-h-[300px] gap-4">
            {currentTeam.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <HelpCircle className="w-12 h-12 mx-auto text-slate-700 mb-3 animate-pulse" />
                <p className="text-sm font-mono">No active recursion tree. Start the solver to watch branching.</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full px-4">
                {Array.from({ length: teamSize }).map((_, idx) => {
                  const member = currentTeam[idx];
                  const isActive = idx === currentTeam.length - 1;
                  
                  return (
                    <React.Fragment key={idx}>
                      <div 
                        className={`relative flex flex-col items-center p-4 rounded-xl border w-full max-w-[170px] transition-all duration-300 ${
                          member 
                            ? isActive 
                              ? "bg-blue-950/40 border-blue-500/80 shadow-md shadow-blue-950/20 glow-active"
                              : "bg-slate-900/80 border-slate-800"
                            : "bg-slate-950/30 border-slate-900 border-dashed text-slate-600"
                        }`}
                      >
                        {/* Depth Index Indicator */}
                        <div className="absolute -top-3 left-3 bg-slate-950 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded-full text-slate-400">
                          d = {idx}
                        </div>

                        {member ? (
                          <div className="flex flex-col items-center text-center mt-1">
                            <span className="text-sm font-semibold text-slate-200 truncate w-full">{member.name}</span>
                            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded px-1.5 py-0.5 mt-1.5">
                              {member.role}
                            </span>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 w-full text-[10px] font-mono text-slate-400 border-t border-slate-800/80 mt-3 pt-2">
                              <span>GPA: {member.cgpa}</span>
                              <span>EXP: {member.experience}y</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 truncate w-full mt-2 text-center" title={member.subRole}>
                              {member.subRole}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-20 text-center">
                            <span className="text-xs font-mono text-slate-500 italic">Empty Slot</span>
                            <span className="text-[10px] font-mono text-slate-600 mt-2">Awaiting branch...</span>
                          </div>
                        )}
                      </div>
                      
                      {idx < teamSize - 1 && (
                        <div className="hidden md:block w-6 h-[2px] bg-slate-800 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Constraint Lookahead Panel */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 mt-auto">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
              Role Constraint Lookahead
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {outstandingRoles.map(item => (
                <div key={item.role} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">{item.role}</span>
                    <span className="text-slate-200">{item.actual}/{item.required}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.actual >= item.required ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min((item.actual / item.required) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Console / Diagnostics (1 col) */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 h-[440px]">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Terminal className="w-5 h-5 text-slate-400" />
            Decision logs & Pruning
          </h3>
          
          <div className="flex-1 overflow-y-auto font-mono text-[11px] bg-slate-950/80 rounded-xl p-3 border border-slate-900 flex flex-col-reverse gap-1.5 h-full scrollbar-thin">
            {backtrackLog.length === 0 ? (
              <span className="text-slate-600 italic">No logs yet. Solver is idle.</span>
            ) : (
              backtrackLog.map((log, idx) => {
                let colorClass = "text-slate-400";
                let Icon = null;
                
                if (log.startsWith("Pruned:")) {
                  colorClass = "text-rose-400/90";
                  Icon = AlertTriangle;
                } else if (log.startsWith("Found feasible")) {
                  colorClass = "text-emerald-400 font-semibold";
                  Icon = CheckCircle2;
                } else if (log.startsWith("Early Stopping:")) {
                  colorClass = "text-amber-400 font-medium";
                  Icon = AlertTriangle;
                } else if (log.startsWith("Trying candidate")) {
                  colorClass = "text-blue-400/95";
                  Icon = Play;
                }
                
                return (
                  <div key={idx} className={`flex items-start gap-1.5 leading-relaxed py-0.5 border-b border-slate-900/30 ${colorClass}`}>
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                    <span>{log}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Check, ShieldAlert, Award, Star, Terminal, Briefcase, MessageSquare, BookOpen } from "lucide-react";

export function TeamInspector({ bestTeam, bestFitness, bestBreakdown, title = "Current Optimal Team Structure" }) {
  if (!bestTeam || bestTeam.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-500 py-12 flex flex-col items-center justify-center">
        <ShieldAlert className="w-12 h-12 text-slate-800 mb-3" />
        <p className="text-sm font-mono">No optimal team selected yet.</p>
        <p className="text-xs text-slate-650 mt-1 font-mono">Run the optimization solver to inspect the resulting team.</p>
      </div>
    );
  }

  // Define metric details
  const metrics = [
    { key: "skillDiversity", label: "Skill Diversity", val: bestBreakdown?.skillDiversity || 0, icon: Award, color: "from-purple-500 to-indigo-500", raw: `${bestBreakdown?.uniqueSkills || 0} unique skills` },
    { key: "cgpa", label: "Academic Average", val: bestBreakdown?.cgpa || 0, icon: BookOpen, color: "from-blue-500 to-cyan-500", raw: `GPA: ${bestBreakdown?.rawAvgCgpa || 0}/10.0` },
    { key: "communication", label: "Communications", val: bestBreakdown?.communication || 0, icon: MessageSquare, color: "from-teal-500 to-emerald-500", raw: `Comm: ${bestBreakdown?.rawAvgComm || 0}/10.0` },
    { key: "experience", label: "Professional Exp", val: bestBreakdown?.experience || 0, icon: Briefcase, color: "from-orange-500 to-amber-500", raw: `Exp: ${bestBreakdown?.rawAvgExp || 0} yrs avg` }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Block */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-450 fill-amber-450/20" />
            {title}
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            K = {bestTeam.length} members satisfying all structural constraints
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-5 py-3 flex flex-col items-end shrink-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Overall Fitness Score</span>
          <span className="text-3xl font-extrabold font-mono text-purple-400">{bestFitness} <span className="text-sm font-semibold text-slate-500">/ 100</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Cards Grid (2 cols equivalent) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bestTeam.map((member, idx) => (
            <div key={member.id} className="bg-slate-900/60 border border-slate-850 hover:border-slate-800 rounded-xl p-4 flex flex-col gap-3 transition-colors duration-250">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                      {member.id}
                    </span>
                    <span className="font-semibold text-slate-200 text-sm leading-none">{member.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium font-sans mt-1">
                    {member.subRole}
                  </span>
                </div>
                <span className="text-[10px] font-semibold tracking-wide font-mono px-2 py-0.5 rounded-full border border-blue-500/35 bg-blue-500/10 text-blue-300 shrink-0">
                  {member.role}
                </span>
              </div>

              {/* Attributes block */}
              <div className="grid grid-cols-3 gap-2 bg-slate-955/50 rounded-lg p-2 border border-slate-950 text-center font-mono">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-slate-500">CGPA</span>
                  <span className="text-xs font-semibold text-slate-300">{member.cgpa}</span>
                </div>
                <div className="flex flex-col gap-0.5 border-x border-slate-800/80">
                  <span className="text-[9px] text-slate-500">COMM</span>
                  <span className="text-xs font-semibold text-slate-300">{member.communication}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-slate-500">EXP</span>
                  <span className="text-xs font-semibold text-slate-300">{member.experience}y</span>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {member.skills.map((skill) => (
                  <span 
                    key={skill} 
                    className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-350 rounded border border-slate-750/50 transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Breakdown (1 col) */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Terminal className="w-5 h-5 text-slate-400" />
            Attribute Scoring Matrix
          </h3>
          
          <div className="flex flex-col gap-4 flex-1 justify-center">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.key} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-slate-500" />
                      {m.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono italic">({m.raw})</span>
                      <span className="font-bold font-mono text-slate-200 text-sm">{m.val.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-500`}
                      style={{ width: `${m.val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Feasibility Check Seal */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 mt-auto flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col text-[10px] leading-tight">
              <span className="text-emerald-350 font-bold font-mono uppercase tracking-wider">Feasibility Seal Active</span>
              <span className="text-slate-400 font-sans mt-0.5">Constraint Satisfied (Rreq met, unique candidates, size K).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo } from "react";
import { TrendingUp, BarChart, Dna } from "lucide-react";

export function EvolutionChart({ gaHistory, generations, gaCurrentGen, gaBestFitness, popSize }) {
  // SVG Dimensions
  const width = 600;
  const height = 260;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Process data points
  const points = useMemo(() => {
    if (gaHistory.length === 0) return null;

    // Find min and max fitness to scale the Y-axis
    let minF = 100;
    let maxF = 0;
    gaHistory.forEach(d => {
      if (d.worstFitness < minF) minF = d.worstFitness;
      if (d.bestFitness > maxF) maxF = d.bestFitness;
    });

    // Pad Y axis slightly
    const yMin = Math.max(0, Math.floor(minF - 5));
    const yMax = Math.min(100, Math.ceil(maxF + 5));
    const yRange = yMax - yMin || 1;

    const totalGens = Math.max(generations, gaHistory.length);

    // Map each data point to X, Y coordinates
    const bestPoints = [];
    const avgPoints = [];
    const worstPoints = [];

    gaHistory.forEach(d => {
      const x = paddingLeft + (d.generation / totalGens) * chartWidth;
      
      const yBest = paddingTop + chartHeight - ((d.bestFitness - yMin) / yRange) * chartHeight;
      const yAvg = paddingTop + chartHeight - ((d.avgFitness - yMin) / yRange) * chartHeight;
      const yWorst = paddingTop + chartHeight - ((d.worstFitness - yMin) / yRange) * chartHeight;

      bestPoints.push({ x, y: yBest, val: d.bestFitness });
      avgPoints.push({ x, y: yAvg, val: d.avgFitness });
      worstPoints.push({ x, y: yWorst, val: d.worstFitness });
    });

    return {
      bestPoints,
      avgPoints,
      worstPoints,
      yMin,
      yMax,
      totalGens
    };
  }, [gaHistory, generations, chartWidth, chartHeight]);

  // Construct SVG paths
  const paths = useMemo(() => {
    if (!points || points.bestPoints.length === 0) return null;

    const createPathString = (pts) => {
      return pts.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
      }, "");
    };

    const bestPath = createPathString(points.bestPoints);
    const avgPath = createPathString(points.avgPoints);
    const worstPath = createPathString(points.worstPoints);

    // Create closed path for area fill under the best curve
    let bestAreaPath = "";
    if (points.bestPoints.length > 0) {
      const first = points.bestPoints[0];
      const last = points.bestPoints[points.bestPoints.length - 1];
      const baseY = paddingTop + chartHeight;
      bestAreaPath = `M ${first.x} ${baseY} L ${bestPath.substring(1)} L ${last.x} ${baseY} Z`;
    }

    return {
      bestPath,
      avgPath,
      worstPath,
      bestAreaPath
    };
  }, [points, chartHeight]);

  // Generate grid ticks
  const ticks = useMemo(() => {
    if (!points) return { yTicks: [], xTicks: [] };

    const { yMin, yMax, totalGens } = points;
    const yTicks = [];
    const xTicks = [];

    // 5 horizontal gridlines
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(yMin + (i / 4) * (yMax - yMin));
      const y = paddingTop + chartHeight - (i / 4) * chartHeight;
      yTicks.push({ val, y });
    }

    // 5 vertical gridlines
    for (let i = 0; i <= 4; i++) {
      const gen = Math.round((i / 4) * totalGens);
      const x = paddingLeft + (i / 4) * chartWidth;
      xTicks.push({ gen, x });
    }

    return { yTicks, xTicks };
  }, [points, chartWidth, chartHeight]);

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-2">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Dna className="w-5 h-5 text-indigo-400" />
          GA Population Optimization
        </h3>
        
        {gaHistory.length > 0 && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
              <span className="text-slate-400">Best:</span>
              <span className="text-violet-300 font-bold">{gaBestFitness}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-slate-400">Avg:</span>
              <span className="text-blue-300 font-bold">
                {gaHistory[gaHistory.length - 1]?.avgFitness}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-500">Gen:</span>
              <span className="text-slate-350">{gaCurrentGen} / {generations}</span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full flex justify-center bg-slate-950/30 rounded-xl p-2 border border-slate-900/60 overflow-hidden">
        {gaHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[260px] text-slate-500">
            <BarChart className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
            <p className="text-sm font-mono">Genetic Algorithm is idle.</p>
            <p className="text-xs text-slate-650 mt-1 font-mono">Run solver to visualize evolutionary climb.</p>
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-full">
            <defs>
              <linearGradient id="bestAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {ticks.yTicks.map((tick, idx) => (
              <g key={`y-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={tick.y}
                  x2={width - paddingRight}
                  y2={tick.y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray={idx === 0 || idx === 4 ? "0" : "4 4"}
                />
                <text
                  x={paddingLeft - 8}
                  y={tick.y + 4}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {tick.val}
                </text>
              </g>
            ))}

            {ticks.xTicks.map((tick, idx) => (
              <g key={`x-${idx}`}>
                <line
                  x1={tick.x}
                  y1={paddingTop}
                  x2={tick.x}
                  y2={paddingTop + chartHeight}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={tick.x}
                  y={paddingTop + chartHeight + 14}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  g={tick.gen}
                </text>
              </g>
            ))}

            {/* Data Paths */}
            {paths && (
              <>
                {/* Area Fill */}
                <path d={paths.bestAreaPath} fill="url(#bestAreaGrad)" />

                {/* Worst Fitness Path */}
                <path
                  d={paths.worstPath}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Average Fitness Path */}
                <path
                  d={paths.avgPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                />

                {/* Best Fitness Path */}
                <path
                  d={paths.bestPath}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        )}
      </div>

      {/* GA Insight Footer */}
      {gaHistory.length > 0 && (
        <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 flex items-start gap-2.5">
          <TrendingUp className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-[11px] leading-relaxed">
            <span className="text-slate-300 font-medium">Evolutionary Convergence Insight:</span>
            <p className="text-slate-400">
              The seed population (size P={popSize}) contains 100% valid combinations filtered by Phase 1. 
              Our feasibility-preserving mutation checks prevents structural breakdown, forcing the GA to explore 
              only the optimal feasible search space and converge without invalid chromosomal drift.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

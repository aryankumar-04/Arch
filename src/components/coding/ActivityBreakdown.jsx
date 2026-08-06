import React, { useMemo } from 'react';
import Card from '../common/Card';

export const PLATFORM_COLORS = {
  'LeetCode': 'var(--green)',
  'GitHub Push': 'var(--accent)',
  'HackerRank': 'var(--orange)',
  'Codeforces': 'var(--red)',
  'Project / Custom': 'var(--text2)',
  'Other': 'var(--text2)'
};

export const getPlatformColor = (platform) => {
  return PLATFORM_COLORS[platform] || 'var(--text2)';
};

export const ActivityBreakdown = ({ problems = [] }) => {
  const stats = useMemo(() => {
    const relevantProblems = problems.filter(p => p && ['LeetCode', 'GitHub Push', 'HackerRank', 'Codeforces'].includes(p.platform));
    const totalRelevantCount = relevantProblems.length;

    const DIFFICULTY_WEIGHTS = {
      Easy: 1,
      Medium: 2,
      Hard: 3
    };

    const weightedScores = {
      LeetCode: 0,
      'GitHub Push': 0,
      HackerRank: 0,
      Codeforces: 0
    };

    relevantProblems.forEach(p => {
      const weight = DIFFICULTY_WEIGHTS[p.difficulty] || 1;
      if (weightedScores[p.platform] !== undefined) {
        weightedScores[p.platform] += weight;
      }
    });

    const totalWeightedScore = Object.values(weightedScores).reduce((acc, curr) => acc + curr, 0);

    const pcts = {
      LeetCode: totalWeightedScore > 0 ? Math.round((weightedScores.LeetCode / totalWeightedScore) * 100) : 0,
      'GitHub Push': totalWeightedScore > 0 ? Math.round((weightedScores['GitHub Push'] / totalWeightedScore) * 100) : 0,
      HackerRank: totalWeightedScore > 0 ? Math.round((weightedScores.HackerRank / totalWeightedScore) * 100) : 0,
      Codeforces: totalWeightedScore > 0 ? Math.round((weightedScores.Codeforces / totalWeightedScore) * 100) : 0
    };

    // Determine dominant type among the 4 platforms based on weighted scores
    let dominant = null;
    let maxScore = -1;
    if (totalWeightedScore > 0) {
      Object.keys(weightedScores).forEach(key => {
        if (weightedScores[key] > maxScore) {
          maxScore = weightedScores[key];
          dominant = key;
        }
      });
    }

    return { weightedScores, pcts, totalRelevantCount, totalWeightedScore, dominant };
  }, [problems]);

  const { pcts, dominant } = stats;

  // Helper to calculate line thickness (2px to 9px) and arm length based on weighted percentage
  const getArmStyle = (pct) => {
    const thickness = pct > 0 ? Math.max(3, Math.round(2 + (pct / 100) * 7)) : 2;
    const length = pct > 0 ? Math.max(12, Math.round((pct / 100) * 55)) : 0;
    const opacity = pct > 0 ? Math.min(1, 0.45 + (pct / 100) * 0.55) : 0.2;
    return { thickness, length, opacity };
  };

  const leetStyle = getArmStyle(pcts.LeetCode);
  const githubStyle = getArmStyle(pcts['GitHub Push']);
  const hackerrankStyle = getArmStyle(pcts.HackerRank);
  const codeforcesStyle = getArmStyle(pcts.Codeforces);

  return (
    <Card hover={false} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 24px' }}>
      <div>
        <div style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.9rem', borderBottom: 'var(--bw) solid var(--border)', paddingBottom: '4px' }}>
          🎯 ACTIVITY BREAKDOWN
        </div>

        {/* Plus / Crosshair Diagram Area */}
        <div style={{ position: 'relative', width: '100%', height: '170px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Base Crosshair Lines */}
          <div style={{ position: 'absolute', width: '120px', height: '2px', background: 'var(--border)', opacity: 0.35 }} />
          <div style={{ position: 'absolute', width: '2px', height: '120px', background: 'var(--border)', opacity: 0.35 }} />

          {/* Center Hub */}
          <div style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'var(--bg2)',
            border: '2px solid var(--border)',
            zIndex: 3
          }} />

          {/* Top Arm: LeetCode (Green) */}
          <div style={{
            position: 'absolute',
            width: `${leetStyle.thickness}px`,
            height: `${leetStyle.length}px`,
            background: PLATFORM_COLORS.LeetCode,
            bottom: '50%',
            left: `calc(50% - ${leetStyle.thickness / 2}px)`,
            borderRadius: '2px',
            opacity: leetStyle.opacity,
            zIndex: 2,
            transition: 'all 0.3s ease'
          }} />

          {/* Right Arm: GitHub Push (Accent Blue) */}
          <div style={{
            position: 'absolute',
            height: `${githubStyle.thickness}px`,
            width: `${githubStyle.length}px`,
            background: PLATFORM_COLORS['GitHub Push'],
            left: '50%',
            top: `calc(50% - ${githubStyle.thickness / 2}px)`,
            borderRadius: '2px',
            opacity: githubStyle.opacity,
            zIndex: 2,
            transition: 'all 0.3s ease'
          }} />

          {/* Bottom Arm: HackerRank (Orange) */}
          <div style={{
            position: 'absolute',
            width: `${hackerrankStyle.thickness}px`,
            height: `${hackerrankStyle.length}px`,
            background: PLATFORM_COLORS.HackerRank,
            top: '50%',
            left: `calc(50% - ${hackerrankStyle.thickness / 2}px)`,
            borderRadius: '2px',
            opacity: hackerrankStyle.opacity,
            zIndex: 2,
            transition: 'all 0.3s ease'
          }} />

          {/* Left Arm: Codeforces (Red) */}
          <div style={{
            position: 'absolute',
            height: `${codeforcesStyle.thickness}px`,
            width: `${codeforcesStyle.length}px`,
            background: PLATFORM_COLORS.Codeforces,
            right: '50%',
            top: `calc(50% - ${codeforcesStyle.thickness / 2}px)`,
            borderRadius: '2px',
            opacity: codeforcesStyle.opacity,
            zIndex: 2,
            transition: 'all 0.3s ease'
          }} />

          {/* Top Label: LeetCode */}
          <div style={{
            position: 'absolute',
            top: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: dominant === 'LeetCode' ? PLATFORM_COLORS.LeetCode : 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>LeetCode</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: PLATFORM_COLORS.LeetCode }}>({pcts.LeetCode}%)</span>
          </div>

          {/* Right Label: GitHub Push */}
          <div style={{
            position: 'absolute',
            right: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: dominant === 'GitHub Push' ? PLATFORM_COLORS['GitHub Push'] : 'var(--text)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            lineHeight: 1.1
          }}>
            <span>GitHub Push</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: PLATFORM_COLORS['GitHub Push'] }}>({pcts['GitHub Push']}%)</span>
          </div>

          {/* Bottom Label: HackerRank */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: dominant === 'HackerRank' ? PLATFORM_COLORS.HackerRank : 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>HackerRank</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: PLATFORM_COLORS.HackerRank }}>({pcts.HackerRank}%)</span>
          </div>

          {/* Left Label: Codeforces */}
          <div style={{
            position: 'absolute',
            left: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: dominant === 'Codeforces' ? PLATFORM_COLORS.Codeforces : 'var(--text)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            lineHeight: 1.1
          }}>
            <span>Codeforces</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: PLATFORM_COLORS.Codeforces }}>({pcts.Codeforces}%)</span>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="flex flex-center gap-6 mt-16 flex-wrap" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
        {dominant ? (
          <div className="badge badge-blue" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '4px 8px' }}>
            🔥 DOMINANT: {pcts[dominant]}% {dominant}
          </div>
        ) : (
          <div className="badge badge-yellow" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '4px 8px' }}>
            No platform activity logged yet
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityBreakdown;

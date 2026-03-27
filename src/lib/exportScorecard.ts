import type { Trip, PlayerId } from '../types';
import { players } from '../config/players';
import { getCourse } from '../config/courses';
import { getHoleOrder, getCompletedHoles, getGrossTotalForRound, getNetTotalForRound } from './scoring';
import { formatMatchPlayStatus } from './matchPlay';
import { calculatePoints } from './points';

function name(pid: PlayerId): string {
  return players.find((p) => p.id === pid)?.name ?? pid;
}

const COLORS = {
  bg: '#0f172a',
  card: '#1e293b',
  cardBorder: '#334155',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  emerald: '#34d399',
  amber: '#fbbf24',
  amberDim: '#92400e',
  eagle: '#facc15',
  birdie: '#f87171',
  bogey: '#38bdf8',
  doubleBogey: '#0284c7',
};

export async function exportScorecardImage(trip: Trip): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const W = 1080;
  const PAD = 40;

  const completedRounds = trip.rounds.filter((r) => r.isComplete);
  const achievements = trip.achievements ?? [];
  const pts = calculatePoints(trip);

  const roundHeight = 280;
  const achievementRows = Math.ceil(achievements.length / 2);
  const achievementSectionHeight = achievements.length > 0 ? 60 + achievementRows * 50 : 0;
  const H = 260 + completedRounds.length * roundHeight + 220 + achievementSectionHeight + 100;

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  let y = PAD;

  ctx.fillStyle = COLORS.amber;
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("Sam's Tampa Golf Extravaganza", W / 2, y + 36);
  y += 50;

  ctx.fillStyle = COLORS.textDim;
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Tampa Bay \u2022 March 2026', W / 2, y + 16);
  y += 40;

  ctx.fillStyle = COLORS.emerald;
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  const mp90Text = formatMatchPlayStatus(
    trip.matchPlay90.cumulativeStatus,
    trip.matchPlay90.holesPlayed,
    90,
    'Sam',
    'Cole',
  );
  ctx.fillText(`90-Hole Match: ${mp90Text}`, W / 2, y + 22);
  y += 50;

  drawDivider(ctx, PAD, y, W - PAD * 2);
  y += 20;

  ctx.textAlign = 'left';

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('POINTS STANDINGS', PAD, y + 14);
  y += 30;

  const sortedPts = (Object.entries(pts) as [PlayerId, { total: number; roundWins: number; birdies: number; eagles: number; overallMatch: number; firLeader: number; girLeader: number }][])
    .sort((a, b) => b[1].total - a[1].total);

  for (const [pid, b] of sortedPts) {
    drawRoundedRect(ctx, PAD, y, W - PAD * 2, 40, 8, COLORS.card);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(name(pid), PAD + 16, y + 26);
    ctx.fillStyle = COLORS.amber;
    ctx.textAlign = 'right';
    ctx.fillText(`${b.total} pts`, W - PAD - 16, y + 26);
    ctx.textAlign = 'left';
    y += 48;
  }

  y += 10;

  for (let ri = 0; ri < completedRounds.length; ri++) {
    const round = completedRounds[ri];
    const roundIdx = trip.rounds.indexOf(round);
    const course = getCourse(round.courseId);
    const holeOrder = getHoleOrder(round.startingHole);
    const completed = getCompletedHoles(round.scores, holeOrder);
    const tee = round.teeData;
    const activePlayers = players.filter((p) => round.activePlayers.includes(p.id));

    drawRoundedRect(ctx, PAD, y, W - PAD * 2, roundHeight - 20, 12, COLORS.card);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Round ${roundIdx + 1} — ${course?.name ?? 'Unknown'}`, PAD + 16, y + 28);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    const formatLabel = round.format.charAt(0).toUpperCase() + round.format.slice(1);
    ctx.fillText(`${tee.name} Tees \u2022 ${formatLabel} \u2022 ${completed.length} holes`, PAD + 16, y + 48);

    const tableY = y + 65;
    const colW = (W - PAD * 2 - 100) / Math.min(completed.length, 18);
    const rowH = 22;

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText('Hole', PAD + 16, tableY + 12);

    const maxCols = Math.min(completed.length, 18);
    for (let i = 0; i < maxCols; i++) {
      ctx.fillStyle = COLORS.textDim;
      ctx.textAlign = 'center';
      ctx.fillText(`${completed[i]}`, PAD + 70 + i * colW + colW / 2, tableY + 12);
    }

    ctx.textAlign = 'right';
    ctx.fillText('Tot', W - PAD - 16, tableY + 12);
    ctx.textAlign = 'left';

    const parRow = tableY + rowH;
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText('Par', PAD + 16, parRow + 12);
    let parTotal = 0;
    for (let i = 0; i < maxCols; i++) {
      const hc = tee.holes.find((h) => h.hole === completed[i]);
      const p = hc?.par ?? 0;
      parTotal += p;
      ctx.textAlign = 'center';
      ctx.fillText(`${p}`, PAD + 70 + i * colW + colW / 2, parRow + 12);
    }
    ctx.textAlign = 'right';
    ctx.fillText(`${parTotal}`, W - PAD - 16, parRow + 12);
    ctx.textAlign = 'left';

    for (let pi = 0; pi < activePlayers.length; pi++) {
      const player = activePlayers[pi];
      const playerRow = parRow + (pi + 1) * rowH;
      const pScores = round.scores[player.id] ?? [];
      const gross = getGrossTotalForRound(pScores, completed);
      const net = getNetTotalForRound(pScores, completed);

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillText(player.name, PAD + 16, playerRow + 12);

      for (let i = 0; i < maxCols; i++) {
        const hole = completed[i];
        const score = pScores.find((s) => s.hole === hole);
        const hc = tee.holes.find((h) => h.hole === hole);
        const par = hc?.par ?? 4;
        const g = score?.grossScore ?? 0;

        if (g > 0) {
          const diff = g - par;
          ctx.fillStyle = diff <= -2 ? COLORS.eagle
            : diff === -1 ? COLORS.birdie
            : diff === 0 ? COLORS.text
            : diff === 1 ? COLORS.bogey
            : COLORS.doubleBogey;
        } else {
          ctx.fillStyle = COLORS.textDim;
        }
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(g > 0 ? `${g}` : '-', PAD + 70 + i * colW + colW / 2, playerRow + 12);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${gross}`, W - PAD - 50, playerRow + 12);
      ctx.fillStyle = COLORS.emerald;
      ctx.font = '10px system-ui, -apple-system, sans-serif';
      ctx.fillText(`(${net})`, W - PAD - 16, playerRow + 12);
      ctx.textAlign = 'left';
    }

    y += roundHeight;
  }

  if (achievements.length > 0) {
    y += 10;
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ACHIEVEMENTS', PAD, y + 14);
    y += 30;

    const achColW = (W - PAD * 2 - 10) / 2;
    for (let i = 0; i < achievements.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ax = PAD + col * (achColW + 10);
      const ay = y + row * 50;

      drawRoundedRect(ctx, ax, ay, achColW, 42, 8, COLORS.card);

      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'left';
      ctx.fillText(achievements[i].icon, ax + 10, ay + 28);

      ctx.fillStyle = COLORS.amber;
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(achievements[i].title, ax + 38, ay + 18);

      ctx.fillStyle = COLORS.textDim;
      ctx.font = '10px system-ui, -apple-system, sans-serif';
      const achName = name(achievements[i].playerId);
      ctx.fillText(`${achName} \u2022 R${achievements[i].roundIndex + 1}`, ax + 38, ay + 34);
    }
    y += achievementRows * 50 + 20;
  }

  y += 20;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Generated by Sam\'s Tampa Golf Extravaganza App', W / 2, y + 12);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number, color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function drawDivider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.strokeStyle = COLORS.cardBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

export async function shareScorecard(trip: Trip): Promise<void> {
  const blob = await exportScorecardImage(trip);
  const file = new File([blob], 'tampa-extravaganza-scorecard.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "Sam's Tampa Golf Extravaganza",
      text: `Check out the scores from Sam's Tampa Golf Extravaganza!`,
      files: [file],
    });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tampa-extravaganza-scorecard.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

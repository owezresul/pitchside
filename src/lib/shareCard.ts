import { BIBS, bibOf } from '../store';
import { isNative, shareImageNative } from './native';
import { getI18n } from '../i18n/react';
import { bracketSize, type Bracket, type PlayedMatch, type StandingRow, type Team } from '../engine';

const W = 1080;
const FONT = '"Archivo Variable", system-ui, sans-serif';

export async function renderShareCard(
  teams: Team[],
  history: PlayedMatch[],
  tables: { title: string | null; rows: StandingRow[] }[],
): Promise<Blob> {
  const { t, L, lang } = getI18n();
  await document.fonts.load(`800 40px ${FONT}`);
  await document.fonts.load(`500 40px ${FONT}`);
  const totalRows = tables.reduce((n, tb) => n + tb.rows.length, 0);
  const rowH = totalRows > 8 ? 64 : Math.min(96, 560 / Math.max(totalRows, 1));
  const big = rowH >= 80;
  const blockH = (tb: { title: string | null; rows: StandingRow[] }) => (tb.title ? 64 : 0) + 56 + tb.rows.length * rowH + 40;
  const recent = history.slice(-5).reverse();
  const recentH = recent.length ? 120 + recent.length * 62 : 0;
  const H = Math.max(1350, 300 + tables.reduce((n, tb) => n + blockH(tb), 0) + recentH + 140);

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const name = (id: string) => teams.find((t) => t.id === id)?.name ?? id;

  g.fillStyle = '#0F2019'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(238,241,230,0.07)'; g.lineWidth = 6;
  g.strokeRect(40, 40, W - 80, H - 80);
  g.beginPath(); g.arc(W / 2, H - 40, 220, Math.PI, 0); g.stroke();

  g.fillStyle = '#EEF1E6'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.font = `800 92px ${FONT}`; g.fillText(tables.length > 1 ? t('card.groups') : t('card.table'), 90, 190);
  g.fillStyle = '#8FA89B'; g.font = `500 34px ${FONT}`;
  g.fillText(t('card.played', { n: history.length }), 90, 240);

  const cols = { p: 610, w: 690, d: 770, l: 850, gd: 930, pts: 990 };
  let y = 300;
  for (const tb of tables) {
    if (tb.title) {
      g.textAlign = 'left'; g.fillStyle = '#EEF1E6'; g.font = `800 40px ${FONT}`;
      g.fillText(L(tb.title), 90, y + 36); y += 64;
    }
    g.font = `600 28px ${FONT}`; g.fillStyle = '#8FA89B'; g.textAlign = 'right';
    g.fillText(t('col.p'), cols.p, y + 34); g.fillText(t('col.w'), cols.w, y + 34); g.fillText(t('col.d'), cols.d, y + 34);
    g.fillText(t('col.l'), cols.l, y + 34); g.fillText(t('col.gd'), cols.gd, y + 34); g.fillText(t('col.pts'), cols.pts, y + 34);
    y += 56;
    tb.rows.forEach((r, i) => {
      const ry = y + i * rowH;
      const bib = bibOf(r.teamId) ?? BIBS[0];
      if (i % 2 === 0) { g.fillStyle = 'rgba(238,241,230,0.05)'; g.fillRect(70, ry, W - 140, rowH); }
      g.fillStyle = bib.color; g.fillRect(70, ry, 14, rowH);
      g.textAlign = 'left'; g.fillStyle = '#8FA89B'; g.font = `700 ${big ? 36 : 28}px ${FONT}`;
      g.fillText(String(i + 1), 108, ry + rowH / 2 + (big ? 13 : 10));
      let nameSize = big ? 44 : 34;
      g.font = `800 ${nameSize}px ${FONT}`;
      while (nameSize > 22 && g.measureText(name(r.teamId)).width > 560 - 170) { nameSize -= 2; g.font = `800 ${nameSize}px ${FONT}`; }
      g.fillStyle = '#EEF1E6';
      g.fillText(name(r.teamId), 170, ry + rowH / 2 + Math.round(nameSize / 3));
      g.textAlign = 'right'; g.font = `500 ${big ? 38 : 30}px ${FONT}`; g.fillStyle = '#B9CBC0';
      const my = ry + rowH / 2 + (big ? 13 : 10);
      g.fillText(String(r.played), cols.p, my); g.fillText(String(r.won), cols.w, my);
      g.fillText(String(r.drawn), cols.d, my); g.fillText(String(r.lost), cols.l, my);
      g.fillText(r.goalDiff > 0 ? `+${r.goalDiff}` : String(r.goalDiff), cols.gd, my);
      g.fillStyle = '#EEF1E6'; g.font = `800 ${big ? 46 : 36}px ${FONT}`; g.fillText(String(r.points), cols.pts, my);
    });
    y += tb.rows.length * rowH + 40;
  }

  if (recent.length) {
    y += 40;
    g.textAlign = 'left'; g.fillStyle = '#8FA89B'; g.font = `600 28px ${FONT}`;
    g.fillText(t('card.latest'), 90, y);
    y += 30;
    for (const m of recent) {
      y += 62;
      g.font = `600 36px ${FONT}`; g.fillStyle = '#EEF1E6';
      g.textAlign = 'right'; g.fillText(name(m.home), 470, y);
      g.textAlign = 'center'; g.font = `800 40px ${FONT}`; g.fillText(`${m.homeScore} – ${m.awayScore}`, 540, y);
      g.textAlign = 'left'; g.font = `600 36px ${FONT}`; g.fillText(name(m.away), 610, y);
    }
  }
  g.textAlign = 'right'; g.fillStyle = 'rgba(238,241,230,0.35)'; g.font = `500 26px ${FONT}`;
  g.fillText(new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : undefined, { day: 'numeric', month: 'short', year: 'numeric' }), W - 90, H - 80);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not render image'))), 'image/png'));
}

export async function renderBracketCard(teams: Team[], bracket: Bracket, seedCount = teams.length, projected = false): Promise<Blob> {
  const i18n = getI18n();
  await document.fonts.load(`800 40px ${FONT}`);
  await document.fonts.load(`500 40px ${FONT}`);

  const CARD_W = 300, CARD_H = 128, GAP = 60, U = 84, MARGIN = 90;
  const size = bracketSize(seedCount);
  const tiers = Math.log2(size);
  const all = bracket.rounds.flatMap((r) => r.matches);
  const real = all.filter((m) => m.tier !== undefined);
  const third = all.find((m) => m.tier === undefined);
  const out = bracket.outcome;

  const W = Math.max(1080, MARGIN * 2 + tiers * CARD_W + (tiers - 1) * GAP);
  const treeX = Math.round((W - (tiers * CARD_W + (tiers - 1) * GAP)) / 2);
  const treeTop = 250 + (out ? 190 : 0) + 20;
  const headY = treeTop + 40;
  const treeBottom = headY + size * U;
  const H = Math.max(1080, treeBottom + (third ? 250 : 0) + 140);

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const name = (id: string | null) => (id ? teams.find((t) => t.id === id)?.name ?? id : 'TBD');
  const x = (t: number) => treeX + t * (CARD_W + GAP);
  const cy = (m: (typeof all)[number]) => headY + (m.pos! + 0.5) * 2 ** (m.tier! + 1) * U;

  const rr = (px: number, py: number, w: number, h: number, r: number) => {
    g.beginPath();
    g.moveTo(px + r, py); g.arcTo(px + w, py, px + w, py + h, r); g.arcTo(px + w, py + h, px, py + h, r);
    g.arcTo(px, py + h, px, py, r); g.arcTo(px, py, px + w, py, r); g.closePath();
  };
  const fit = (text: string, maxW: number) => {
    if (g.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && g.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
    return `${t}…`;
  };

  g.fillStyle = '#0F2019'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(238,241,230,0.07)'; g.lineWidth = 6;
  g.strokeRect(40, 40, W - 80, H - 80);
  g.beginPath(); g.arc(W / 2, H - 40, 220, Math.PI, 0); g.stroke();

  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.fillStyle = '#EEF1E6'; g.font = `800 92px ${FONT}`; {
    const title = projected ? i18n.t('card.playoffsProjected') : i18n.t('card.playoffs');
    let size = 92;
    do { g.font = `800 ${size}px ${FONT}`; size -= 4; } while (g.measureText(title).width > W - MARGIN * 2 && size > 40);
    g.fillText(title, MARGIN, 190);
  }

  if (out) {
    const bib = bibOf(out.champion) ?? BIBS[0];
    g.fillStyle = bib.color; rr(MARGIN, 250, W - MARGIN * 2, 150, 24); g.fill();
    g.fillStyle = bib.ink; g.font = `600 30px ${FONT}`; g.fillText(i18n.t('card.champions'), MARGIN + 30, 250 + 52);
    g.font = `800 72px ${FONT}`; g.fillText(fit(name(out.champion), W - MARGIN * 2 - 60), MARGIN + 30, 250 + 124);
  }

  // round headings
  g.font = `600 26px ${FONT}`; g.fillStyle = '#8FA89B';
  for (let t = 0; t < tiers; t++) {
    const label = bracket.rounds.find((r) => r.matches.some((m) => m.tier === t))?.name;
    if (label) g.fillText(i18n.L(label), x(t), treeTop + 16);
  }

  // connectors
  g.strokeStyle = 'rgba(238,241,230,0.28)'; g.lineWidth = 4; g.lineJoin = 'round';
  for (const m of real) {
    const parent = real.find((p) => p.tier === m.tier! + 1 && p.pos === Math.floor(m.pos! / 2));
    if (!parent) continue;
    const x1 = x(m.tier!) + CARD_W; const mid = x1 + GAP / 2;
    g.beginPath(); g.moveTo(x1, cy(m)); g.lineTo(mid, cy(m)); g.lineTo(mid, cy(parent)); g.lineTo(x(m.tier! + 1), cy(parent)); g.stroke();
  }

  const drawCard = (m: (typeof all)[number], px: number, py: number) => {
    g.fillStyle = '#173025'; rr(px, py, CARD_W, CARD_H, 18); g.fill();
    g.strokeStyle = '#2A4A3B'; g.lineWidth = 3; rr(px, py, CARD_W, CARD_H, 18); g.stroke();
    g.beginPath(); g.moveTo(px, py + CARD_H / 2); g.lineTo(px + CARD_W, py + CARD_H / 2); g.stroke();
    const r = m.result;
    (['home', 'away'] as const).forEach((side, i) => {
      const slot = side === 'home' ? m.home : m.away;
      const ry = py + i * (CARD_H / 2);
      const lost = r && slot.team !== r.winner;
      const score = r ? (side === 'home' ? r.match.homeScore : r.match.awayScore) : null;
      const baseY = ry + CARD_H / 4 + 11;
      let tx = px + 20;
      if (slot.team) {
        g.fillStyle = (bibOf(slot.team) ?? BIBS[0]).color; rr(px + 18, ry + CARD_H / 4 - 9, 18, 18, 5); g.fill();
        tx = px + 50;
      }
      const reserve = score !== null ? 70 : 20;
      g.textAlign = 'left';
      if (slot.team) {
        const avail = px + CARD_W - reserve - tx - (r?.onPenalties && !lost ? 56 : 0);
        const nm = name(slot.team);
        let fs = 30;
        g.font = `${lost ? 500 : 800} ${fs}px ${FONT}`; g.fillStyle = lost ? '#8FA89B' : '#EEF1E6';
        while (fs > 22 && g.measureText(nm).width > avail) { fs -= 2; g.font = `${lost ? 500 : 800} ${fs}px ${FONT}`; }
        g.fillText(fit(nm, avail), tx, baseY);
      } else {
        g.font = `500 22px ${FONT}`; g.fillStyle = '#8FA89B';
        g.fillText(fit(i18n.L(slot.label), px + CARD_W - reserve - tx), tx, baseY - 2);
      }
      if (score !== null) {
        g.textAlign = 'right'; g.font = `800 34px ${FONT}`; g.fillStyle = lost ? '#8FA89B' : '#EEF1E6';
        g.fillText(String(score), px + CARD_W - 20, baseY + 2);
        if (r?.onPenalties && !lost) {
          g.font = `600 18px ${FONT}`; g.fillStyle = '#8FA89B'; g.fillText(i18n.t('bracket.pens'), px + CARD_W - 56, baseY);
        }
      }
    });
  };

  for (const m of real) drawCard(m, x(m.tier!), cy(m) - CARD_H / 2);

  if (third) {
    g.textAlign = 'left'; g.font = `600 26px ${FONT}`; g.fillStyle = '#8FA89B';
    g.fillText(i18n.L('Third place'), treeX, treeBottom + 50);
    drawCard(third, treeX, treeBottom + 70);
  }

  g.textAlign = 'right'; g.fillStyle = 'rgba(238,241,230,0.35)'; g.font = `500 26px ${FONT}`;
  g.fillText(new Date().toLocaleDateString(i18n.lang === 'ru' ? 'ru-RU' : undefined, { day: 'numeric', month: 'short', year: 'numeric' }), W - MARGIN, H - 80);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not render image'))), 'image/png'));
}

/**
 * Shares the image with a text caption (the link to the app). On phones this opens the share sheet,
 * on desktop it saves the PNG and copies the caption.
 */
export async function shareOrDownload(blob: Blob, text: string): Promise<'shared' | 'downloaded'> {
  if (isNative) {
    try { await shareImageNative(blob, 'Pitchside', text); } catch { /* cancelled */ }
    return 'shared';
  }
  const file = new File([blob], 'pitchside.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Pitchside', text }); } catch { /* cancelled */ }
    return 'shared';
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'pitchside.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  try { await navigator.clipboard.writeText(text); } catch { /* clipboard not available */ }
  return 'downloaded';
}

import { World } from '../sim/world';
import { CampaignState } from '../sim/campaign';

function fmtWatch(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export interface DebriefInput {
  world: World;
  missionName: string;
  startSeconds: number;
  wcsLog: { t: number; wcs: string }[];
  campaign: CampaignState | null;
  campaignLength: number;
  isCampaign: boolean;
}

export function renderDebrief(input: DebriefInput): string {
  const { world, missionName, startSeconds, wcsLog, campaign, campaignLength, isCampaign } = input;
  const sc = world.score;
  const roundsLeft = world.weapons.roundsReady();

  const stamp = (t: number) => {
    const abs = startSeconds + t;
    const h = Math.floor(abs / 3600) % 24;
    const m = Math.floor(abs / 60) % 60;
    const s = Math.floor(abs) % 60;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(h)}${p(m)}${p(s)}Z`;
  };

  // engagement narrative: declarations, launches, intercepts, frats, leakers
  const kinds = new Set(['DECL_HOS', 'DECL_FND', 'MISSILE', 'INTERCEPT', 'DESTROYED', 'FRATRICIDE', 'LEAKER', 'VIOLATION_NOTE', 'DATALINK']);
  const narrative = world.history
    .filter(ev => kinds.has(ev.kind))
    .map(ev => {
      const cls =
        ev.kind === 'FRATRICIDE' || ev.kind === 'VIOLATION_NOTE' || ev.kind === 'LEAKER'
          ? 'db-bad'
          : ev.kind === 'DESTROYED'
            ? 'db-good'
            : ev.kind === 'MISSILE' || ev.kind === 'DECL_HOS'
              ? 'db-hl'
              : '';
      const label: Record<string, string> = {
        DECL_HOS: 'DECLARED HOSTILE',
        DECL_FND: 'DECLARED FRIENDLY',
        MISSILE: 'LAUNCH',
        INTERCEPT: 'INTERCEPT',
        DESTROYED: 'KILL',
        FRATRICIDE: 'FRATRICIDE',
        LEAKER: 'LEAKER',
        VIOLATION_NOTE: 'FINDING',
        DATALINK: 'LINK ID',
      };
      return `<div class="db-ev ${cls}"><span class="db-t">${stamp(ev.t ?? 0)}</span><span class="db-k">${label[ev.kind]}</span><span class="db-x">${ev.text ?? ''}${ev.tn && ev.kind !== 'VIOLATION_NOTE' ? ` · TRACK ${ev.tn}` : ''}</span></div>`;
    })
    .join('');

  const findings = world.history.filter(ev => ev.kind === 'VIOLATION_NOTE');
  const frats = world.history.filter(ev => ev.kind === 'FRATRICIDE');
  const leakers = world.history.filter(ev => ev.kind === 'LEAKER');

  const wcsLine = wcsLog.length
    ? wcsLog.map(w => `${stamp(w.t)} ${w.wcs}`).join(' → ')
    : 'TIGHT (unchanged)';

  const inquiry = frats.length
    ? `
      <div class="db-inquiry">
        <div class="db-iq-head">◤ BOARD OF INQUIRY — CONVENED</div>
        <p class="db-iq-text">During the watch of ${missionName}, fire under the control of this station destroyed ${frats.length} friendly or neutral ${frats.length > 1 ? 'contacts' : 'contact'}.</p>
        ${frats.map(f => `<p class="db-iq-text">At ${stamp(f.t ?? 0)}: ${f.text ?? ''}.</p>`).join('')}
        <p class="db-iq-text">The operator's console log, weapons status, and identification timeline have been sealed into the record. The board will reconvene at 0600.</p>
        <p class="db-iq-text db-iq-cold">You were the one who said launch.</p>
      </div>`
    : '';

  const nextWatchAvail = isCampaign && campaign && !campaign.finished && campaign.watchIndex < campaignLength;
  const campaignBlock = isCampaign && campaign
    ? `
      <div class="db-camp">
        <span>BASE INTEGRITY ${campaign.baseIntegrity}%</span>
        <span>CAREER ${campaign.totals.kills} KILLS · ${campaign.totals.shots} ROUNDS · ${campaign.totals.leakers} LEAKERS</span>
        <span>VIOLATIONS ${campaign.totals.violations} · FRATRICIDES ${campaign.totals.fratricides}</span>
        <span>WATCH ${Math.min(campaign.watchIndex + 1, campaignLength)} OF ${campaignLength}</span>
      </div>`
    : '';

  const verdict =
    frats.length > 0
      ? 'RELIEVED PENDING INQUIRY'
      : leakers.length > 1
        ? 'PERFORMANCE UNDER REVIEW'
        : sc.kills > 0 && leakers.length === 0 && findings.length === 0
          ? 'COMMENDED — CLEAN WATCH'
          : 'SATISFACTORY';

  return `
    <div class="db-wrap">
      <div class="db-paper">
        <div class="db-head">
          <div class="db-title">AFTER ACTION REPORT</div>
          <div class="db-sub">${missionName} · WATCH LENGTH ${fmtWatch(world.time)}</div>
        </div>
        <div class="db-grid">
          <div><span class="db-k2">THREATS DESTROYED</span><span class="db-v2">${sc.kills}</span></div>
          <div><span class="db-k2">INTERCEPTORS SPENT</span><span class="db-v2">${sc.shots} (${roundsLeft} REMAINING)</span></div>
          <div><span class="db-k2">LEAKERS TO BASE</span><span class="db-v2 ${leakers.length ? 'db-bad' : 'db-good'}">${leakers.length}</span></div>
          <div><span class="db-k2">IDENT VIOLATIONS</span><span class="db-v2 ${findings.length ? 'db-bad' : 'db-good'}">${findings.length}</span></div>
          <div><span class="db-k2">FRATRICIDES</span><span class="db-v2 ${frats.length ? 'db-bad' : 'db-good'}">${frats.length}</span></div>
          <div><span class="db-k2">VERDICT</span><span class="db-v2 ${frats.length ? 'db-bad' : ''}">${verdict}</span></div>
        </div>
        <div class="db-sec">WEAPONS STATUS — ${wcsLine}</div>
        <div class="db-sec2">EVENT LOG</div>
        <div class="db-narrative">${narrative || '<div class="db-ev"><span class="db-x">No engagements recorded.</span></div>'}</div>
        ${inquiry}
        ${campaignBlock}
        <div class="db-actions">
          ${nextWatchAvail ? '<button id="db-next" class="db-btn db-primary">NEXT WATCH ▶</button>' : ''}
          ${isCampaign && campaign?.finished ? '<button id="db-campaign-end" class="db-btn db-primary">CAMPAIGN COMPLETE — SEE RECORD ▶</button>' : ''}
          <button id="db-retry" class="db-btn">REPLAY WATCH</button>
          <button id="db-menu" class="db-btn">MAIN MENU</button>
        </div>
      </div>
    </div>`;
}

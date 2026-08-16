import { World } from '../sim/world';
import { CLASS_LABEL, M_TO_FT, MS_TO_KT, Track } from '../sim/types';

/** Right-hand track table + selected-track detail panel (DOM side of the console). */
export class TrackTable {
  private tbody: HTMLElement;
  private empty: HTMLElement;
  private detail: HTMLElement;
  private count: HTMLElement;
  selectedTn: number | null = null;
  onSelect: ((tn: number | null) => void) | null = null;

  constructor(private world: World) {
    this.tbody = document.getElementById('track-tbody')!;
    this.empty = document.getElementById('track-empty')!;
    this.detail = document.getElementById('detail-body')!;
    this.count = document.getElementById('track-count')!;
  }

  update(ppiBrgRng: (trk: Track) => { brg: number; rngKm: number }): void {
    const tracks = [...this.world.tracks.values()].sort((a, b) => a.tn - b.tn);
    this.count.textContent = `${tracks.length} TRK`;
    this.empty.style.display = tracks.length ? 'none' : 'flex';

    const rows = new Map<number, HTMLElement>();
    for (const trk of tracks) {
      let row = this.tbody.querySelector<HTMLElement>(`tr[data-tn="${trk.tn}"]`);
      if (!row) {
        row = document.createElement('tr');
        row.dataset.tn = String(trk.tn);
        row.innerHTML = '<td></td><td></td><td></td><td></td><td></td><td></td><td></td>';
        row.addEventListener('click', () => {
          if (this.onSelect) this.onSelect(trk.tn);
        });
        this.tbody.appendChild(row);
      }
      rows.set(trk.tn, row);
    }
    // drop rows for vanished tracks (none in M1, future-proof)
    for (const el of Array.from(this.tbody.querySelectorAll('tr'))) {
      if (!rows.has(Number(el.dataset.tn))) el.remove();
    }

    for (const trk of tracks) {
      const e = this.world.entityById(trk.entityId);
      const row = rows.get(trk.tn)!;
      const cells = row.children;
      const { brg, rngKm } = ppiBrgRng(trk);
      const friendly = e?.def.friendly ?? false;
      const spdKt = e ? Math.round((e.speedMs * MS_TO_KT) / 5) * 5 : 0;
      const altFt = e ? e.altM * M_TO_FT : 0;
      const alt = altFt < 1000 ? `${Math.round(altFt / 50) * 50}` : `${(altFt / 1000).toFixed(1)}k`;

      cells[0].textContent = String(trk.tn);
      cells[1].textContent = e ? CLASS_LABEL[e.def.class] : '—';
      cells[2].textContent = friendly ? 'FND' : 'UNK';
      cells[2].className = friendly ? 'id-fnd' : 'id-unk';
      cells[3].textContent = String(spdKt);
      cells[4].textContent = alt;
      cells[5].textContent = String(brg).padStart(3, '0');
      cells[6].textContent = `${rngKm}`;
      row.classList.toggle('selected', this.selectedTn === trk.tn);
    }

    this.renderDetail(ppiBrgRng);
  }

  private renderDetail(ppiBrgRng: (trk: Track) => { brg: number; rngKm: number }): void {
    if (this.selectedTn === null) {
      this.detail.innerHTML = '<div class="empty-hint">NO TRACK SELECTED</div>';
      return;
    }
    const trk = this.world.trackByTn(this.selectedTn);
    const e = trk ? this.world.entityById(trk.entityId) : undefined;
    if (!trk || !e) {
      this.detail.innerHTML = '<div class="empty-hint">NO TRACK SELECTED</div>';
      return;
    }
    const { brg, rngKm } = ppiBrgRng(trk);
    const friendly = e.def.friendly;
    const altFt = e.altM * M_TO_FT;
    const alt = altFt < 1000 ? `${Math.round(altFt / 50) * 50} FT` : `${(altFt / 1000).toFixed(1)}k FT`;
    this.detail.innerHTML = `
      <div class="dt-grid">
        <div class="dt-item"><div class="dt-k">TRACK</div><div class="dt-v">${trk.tn}</div></div>
        <div class="dt-item"><div class="dt-k">CLASS</div><div class="dt-v">${CLASS_LABEL[e.def.class]}</div></div>
        <div class="dt-item"><div class="dt-k">IDENT</div><div class="dt-v ${friendly ? 'id-fnd' : 'id-unk'}">${friendly ? 'FND' : 'UNK'}</div></div>
        <div class="dt-item"><div class="dt-k">IFF</div><div class="dt-v" style="color:var(--faint)">—</div></div>
        <div class="dt-item"><div class="dt-k">SPD</div><div class="dt-v">${Math.round(e.speedMs * MS_TO_KT)} KT</div></div>
        <div class="dt-item"><div class="dt-k">ALT</div><div class="dt-v">${alt}</div></div>
        <div class="dt-item"><div class="dt-k">BRG</div><div class="dt-v">${String(brg).padStart(3, '0')}°</div></div>
        <div class="dt-item"><div class="dt-k">RNG</div><div class="dt-v">${rngKm} KM</div></div>
      </div>
      <div class="dt-actions">
        <button disabled>IFF INTERROGATE — M3</button>
        <button disabled>DECLARE — M3</button>
      </div>`;
  }
}

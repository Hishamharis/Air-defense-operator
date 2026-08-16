export type Wcs = 'HOLD' | 'TIGHT' | 'FREE';

export interface DirectorEvent {
  atT: number;
  /** change weapons control status at this time */
  wcs?: Wcs;
  /** commander/CRC radio line */
  radio?: string;
}

/**
 * The watch director: plays scripted commander/CRC traffic and weapons-control
 * transitions. M3 keeps it linear; M5 grows it into the campaign brain.
 */
export class Director {
  private idx = 0;
  wcs: Wcs;

  constructor(
    private events: DirectorEvent[],
    startWcs: Wcs = 'TIGHT',
    private onWcs?: (wcs: Wcs) => void,
    private onRadio?: (text: string) => void,
  ) {
    this.events = [...events].sort((a, b) => a.atT - b.atT);
    this.wcs = startWcs;
  }

  tick(t: number): void {
    while (this.idx < this.events.length && t >= this.events[this.idx].atT) {
      const ev = this.events[this.idx++];
      if (ev.wcs && ev.wcs !== this.wcs) {
        this.wcs = ev.wcs;
        if (this.onWcs) this.onWcs(ev.wcs);
      }
      if (ev.radio && this.onRadio) this.onRadio(ev.radio);
    }
  }
}

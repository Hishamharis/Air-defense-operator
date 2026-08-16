import { Entity } from './types';

export type Transponder = 'M4' | 'C' | 'NONE' | 'FAILING';

export type IffReplyKind = 'M4' | 'C' | 'NONE' | 'GARBLED';

export interface IffResult {
  kind: IffReplyKind;
  /** console-facing text, e.g. "MODE C 2214 · ALT MATCHES EST" */
  text: string;
  t: number;
}

/** Stable per-aircraft civil Mode 3/A code (octal-ish 4 digits). */
export function mode3Code(entityId: number): string {
  return String(1000 + (entityId * 371) % 7000);
}

/**
 * Roll one interrogation against the aircraft's transponder. Replies are
 * probabilistic: military Mode 4 can be missed, failing boxes answer
 * intermittently, civil boxes always answer Mode C (never Mode 4), hostiles
 * stay silent. The reply is a FACT — concluding friendly/hostile from it is
 * the operator's job.
 */
export function rollIffReply(entity: Entity): IffReplyKind {
  const tp = entity.def.transponder ?? 'NONE';
  const r = Math.random();
  switch (tp) {
    case 'M4':
      return r < 0.9 ? 'M4' : r < 0.95 ? 'GARBLED' : 'NONE';
    case 'FAILING':
      return r < 0.35 ? 'M4' : r < 0.45 ? 'GARBLED' : 'NONE';
    case 'C':
      return 'C';
    default:
      return 'NONE';
  }
}

/** Build the console-facing text for a reply, including the altitude cross-check. */
export function iffText(kind: IffReplyKind, entity: Entity, estAltM: number): string {
  switch (kind) {
    case 'M4':
      return 'MODE 4 VALID';
    case 'C': {
      const match = Math.abs(estAltM - entity.altM) / Math.max(300, entity.altM) < 0.12;
      return `MODE C ${mode3Code(entity.id)} · ALT ${match ? 'MATCHES EST' : 'DISCREPANCY'}`;
    }
    case 'GARBLED':
      return 'GARBLED / INVALID REPLY';
    default:
      return 'NO REPLY';
  }
}

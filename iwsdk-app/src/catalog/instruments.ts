/**
 * Catalog data layer — the single place new instruments are added.
 *
 * To extend the catalog (guitar, keyboard, madal, drum set, ...):
 * 1. add an InstrumentDef entry below,
 * 2. register its viewer asset id in src/assets.ts,
 * 3. place a scene node with the InstrumentViewer component.
 * No viewer, panel, or system code changes are needed.
 */

export interface InstrumentPart {
  /** Must match the named Object3D group inside the model asset. */
  nodeName: string;
  label: string;
  blurb: string;
}

export interface InstrumentDef {
  id: string;
  name: string;
  tagline: string;
  price: string;
  /** Manifest asset id registered in src/assets.ts */
  assetId: string;
  /** Scene node id of the placed instance. */
  nodeId: string;
  parts: InstrumentPart[];
}

export const CATALOG: InstrumentDef[] = [
  {
    id: 'diaphragm-mic',
    name: 'Diaphragm Condenser Mic',
    tagline: 'Large-diaphragm studio condenser',
    price: '$249',
    assetId: 'diaphragm-mic',
    nodeId: 'diaphragm-mic',
    parts: [
      { nodeName: 'GrilleHead', label: 'Grille', blurb: 'Steel mesh head basket' },
      { nodeName: 'DiaphragmCapsule', label: 'Capsule', blurb: '1-inch gold diaphragm' },
      { nodeName: 'MicBody', label: 'Body', blurb: 'All-metal housing, XLR out' },
      { nodeName: 'MountClip', label: 'Mount', blurb: 'Shock mount + stand' },
    ],
  },
];

export function getInstrument(id: string): InstrumentDef {
  const found = CATALOG.find((entry) => entry.id === id);
  if (found == null) throw new Error(`Unknown instrument: ${id}`);
  return found;
}

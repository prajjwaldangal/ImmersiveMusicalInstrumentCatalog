/**
 * Interaction layer — turntable rotation, zoom scaling, and part focus.
 * Manual 360 inspection also works via DistanceGrabbable (trigger) and
 * proximity grab (squeeze); this system adds auto-spin, UI-driven zoom,
 * and emissive part highlighting. Skips held entities via Grabbed exclusion.
 */

import {
  Color,
  createSystem,
  Entity,
  Grabbed,
  Mesh,
  MeshStandardMaterial,
} from '@iwsdk/core';
import { getInstrument } from './catalog/instruments.js';
import { InstrumentViewer } from './instrument-viewer-component.js';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const HIGHLIGHT = new Color(0x1f6feb);

function setEmissive(entity: Entity, hex: number, intensity: number): void {
  const root = entity.object3D;
  if (root == null) return;
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (material instanceof MeshStandardMaterial) {
        material.emissive.setHex(hex);
        material.emissiveIntensity = intensity;
      }
    }
  });
}

export class InstrumentViewerSystem extends createSystem({
  viewers: { required: [InstrumentViewer] },
  free: { required: [InstrumentViewer], excluded: [Grabbed] },
}) {
  init(): void {
    // Clone shared prototype materials per placed instance so the part
    // highlight never leaks across catalog entries sharing one asset.
    this.queries.viewers.subscribe('qualify', (entity: Entity) => {
      const root = entity.object3D;
      if (root == null) return;
      root.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => m.clone());
        } else {
          child.material = child.material.clone();
        }
      });
      this.applyZoom(entity);
    });
  }

  update(delta: number): void {
    for (const entity of this.queries.free.entities) {
      const auto = entity.getValue(InstrumentViewer, 'autoRotate') ?? true;
      if (!auto) continue;
      const speed = entity.getValue(InstrumentViewer, 'spinSpeedDeg') ?? 30;
      const root = entity.object3D;
      if (root == null) continue;
      root.rotation.y += (speed * Math.PI * delta) / 180;
    }
  }

  /** UI wiring helpers (called by the catalog panel system). */
  static toggleSpin(entity: Entity): void {
    const auto = entity.getValue(InstrumentViewer, 'autoRotate') ?? true;
    entity.setValue(InstrumentViewer, 'autoRotate', !auto);
  }

  static nudge(entity: Entity, degrees: number): void {
    const root = entity.object3D;
    if (root == null) return;
    root.rotation.y += (degrees * Math.PI) / 180;
  }

  static zoom(entity: Entity, factor: number): void {
    const current = entity.getValue(InstrumentViewer, 'zoom') ?? 1;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * factor));
    entity.setValue(InstrumentViewer, 'zoom', next);
    const root = entity.object3D;
    if (root == null) return;
    const base = root.userData.baseScale ?? 1;
    if (root.userData.baseScale == null) root.userData.baseScale = base;
    root.scale.setScalar((base as number) * next);
  }

  static resetView(entity: Entity): void {
    entity.setValue(InstrumentViewer, 'zoom', 1);
    entity.setValue(InstrumentViewer, 'focusedPart', '');
    const root = entity.object3D;
    if (root == null) return;
    const base = (root.userData.baseScale as number | undefined) ?? 1;
    root.scale.setScalar(base);
    root.rotation.set(0, 0, 0);
    setEmissive(entity, 0x000000, 0);
  }

  static focusPart(entity: Entity, partName: string): void {
    const instrument = getInstrument(
      entity.getValue(InstrumentViewer, 'instrumentId') ?? 'diaphragm-mic',
    );
    const known = instrument.parts.some((part) => part.nodeName === partName);
    if (!known) return;
    entity.setValue(InstrumentViewer, 'focusedPart', partName);
    setEmissive(entity, 0x000000, 0);
    const root = entity.object3D;
    const target = root?.getObjectByName(partName);
    if (target == null) return;
    target.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material instanceof MeshStandardMaterial) {
          material.emissive.copy(HIGHLIGHT);
          material.emissiveIntensity = 0.6;
        }
      }
    });
  }

  private applyZoom(entity: Entity): void {
    const zoom = entity.getValue(InstrumentViewer, 'zoom') ?? 1;
    const root = entity.object3D;
    if (root == null) return;
    if (root.userData.baseScale == null) root.userData.baseScale = root.scale.x;
    root.scale.setScalar((root.userData.baseScale as number) * zoom);
  }
}

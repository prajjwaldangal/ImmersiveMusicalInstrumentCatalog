/**
 * UI wiring layer — connects the catalog panel buttons to the viewer system.
 * New catalog entries reuse this file unchanged; part buttons resolve from
 * the InstrumentDef parts list via the Btn_Part_<nodeName> id convention.
 */

import { createSystem, UIKit, UIKitMLAsset, VisibilityState } from '@iwsdk/core';
import { CATALOG } from './catalog/instruments.js';
import { InstrumentViewer } from './instrument-viewer-component.js';
import { InstrumentViewerSystem } from './instrument-viewer.js';

function statusText(panel: UIKitMLAsset, message: string): void {
  const status = panel.getElementById<UIKit.Text>('StatusText');
  status?.setProperties({ text: message });
}

export class CatalogPanelSystem extends createSystem({
  viewers: { required: [InstrumentViewer] },
}) {
  init(): void {
    const panel = this.world.getSceneObject<UIKitMLAsset>('catalog-panel');
    if (panel == null) return;

    const mic = () => this.queries.viewers.entities.values().next().value;
    const withMic = (label: string, fn: (entity: NonNullable<ReturnType<typeof mic>>) => void) => () => {
      const entity = mic();
      if (entity == null) {
        statusText(panel, 'Mic is not loaded yet.');
        return;
      }
      fn(entity);
      statusText(panel, label);
    };

    const spinButton = panel.getElementById('Btn_Spin');
    const onSpin = withMic('Auto-spin toggled.', (entity) => {
      InstrumentViewerSystem.toggleSpin(entity);
      const spinning = entity.getValue(InstrumentViewer, 'autoRotate') ?? true;
      spinButton?.setProperties({ text: spinning ? 'Pause spin' : 'Resume spin' });
    });

    const handlers: Array<[string, () => void]> = [
      ['Btn_RotLeft', withMic('Turned 15 degrees left.', (e) => InstrumentViewerSystem.nudge(e, -15))],
      ['Btn_RotRight', withMic('Turned 15 degrees right.', (e) => InstrumentViewerSystem.nudge(e, 15))],
      ['Btn_Spin', onSpin],
      ['Btn_ZoomIn', withMic('Zoomed in.', (e) => InstrumentViewerSystem.zoom(e, 1.25))],
      ['Btn_ZoomOut', withMic('Zoomed out.', (e) => InstrumentViewerSystem.zoom(e, 0.8))],
      ['Btn_Reset', withMic('View reset.', (e) => InstrumentViewerSystem.resetView(e))],
      [
        'Btn_Fullscreen',
        () => {
          const root = document.documentElement;
          if (document.fullscreenElement != null) {
            void document.exitFullscreen().catch(() => undefined);
            statusText(panel, 'Exited fullscreen.');
          } else if (typeof root.requestFullscreen === 'function') {
            void root.requestFullscreen().catch(() => statusText(panel, 'Fullscreen blocked by browser.'));
            statusText(panel, 'Fullscreen on. Esc to exit.');
          } else {
            statusText(panel, 'Fullscreen unavailable here; use XR.');
          }
        },
      ],
    ];

    for (const instrument of CATALOG) {
      for (const part of instrument.parts) {
        const id = `Btn_Part_${part.nodeName}`;
        handlers.push([
          id,
          withMic(`${part.label}: ${part.blurb}`, (e) => InstrumentViewerSystem.focusPart(e, part.nodeName)),
        ]);
      }
    }

    const cleanups: Array<() => void> = [];
    for (const [id, fn] of handlers) {
      const element = panel.getElementById(id);
      if (element == null) continue;
      element.name = id;
      element.addEventListener('click', fn);
      cleanups.push(() => element.removeEventListener('click', fn));
    }

    // XR entry/exit (same contract as the starter welcome panel).
    const enterButton = panel.getElementById('Btn_EnterXR');
    const exitButton = panel.getElementById('Btn_ExitXR');
    if (enterButton != null && exitButton != null) {
      enterButton.name = 'Btn_EnterXR';
      exitButton.name = 'Btn_ExitXR';
      if (!this.world.xrEnabled) {
        enterButton.setProperties({ display: 'none' });
        exitButton.setProperties({ display: 'none' });
      } else {
        const launchXR = () => this.world.launchXR();
        const exitXR = () => this.world.exitXR();
        enterButton.addEventListener('click', launchXR);
        exitButton.addEventListener('click', exitXR);
        cleanups.push(
          () => enterButton.removeEventListener('click', launchXR),
          () => exitButton.removeEventListener('click', exitXR),
          this.world.visibilityState.subscribe((state) => {
            const flat = state === VisibilityState.NonImmersive;
            enterButton.setProperties({ display: flat ? 'flex' : 'none' });
            exitButton.setProperties({ display: flat ? 'none' : 'flex' });
          }),
        );
      }
    }

    for (const cleanup of cleanups) this.cleanupFuncs.push(cleanup);
  }
}

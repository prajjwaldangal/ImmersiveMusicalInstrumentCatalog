/**
 * Component layer — viewer state for one catalog instrument instance.
 * System-free declaration so the editor can author it.
 */

import { createComponent, Types } from '@iwsdk/core';

export const InstrumentViewer = createComponent('InstrumentViewer', {
  instrumentId: { type: Types.String, default: 'diaphragm-mic' },
  autoRotate: { type: Types.Boolean, default: true },
  spinSpeedDeg: { type: Types.Float32, default: 30 },
  zoom: { type: Types.Float32, default: 1 },
  focusedPart: { type: Types.String, default: '' },
});

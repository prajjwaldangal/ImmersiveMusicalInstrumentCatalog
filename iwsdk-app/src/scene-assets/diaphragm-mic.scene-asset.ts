/**
 * Model layer — procedural large-diaphragm condenser mic.
 * Parentless Object3D prototype; deterministic and side-effect free.
 * Origin: mic vertical center. Up: +Y. Size envelope ~0.34 m tall.
 * Named groups (must match src/catalog/instruments.ts): GrilleHead,
 * DiaphragmCapsule, MicBody, XLRConnector, MountClip, ModeSwitch.
 */

import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
} from '@iwsdk/core';

function metal(color: number, roughness: number, metalness: number): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness, metalness });
}

function mesh(geometry: BufferGeometry, material: MeshStandardMaterial, name: string): Mesh {
  const m = new Mesh(geometry, material);
  m.name = name;
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

export function buildDiaphragmMic(): Object3D {
  const root = new Group();
  root.name = 'DiaphragmMic';

  const bodyMat = metal(0x23262b, 0.35, 0.85);
  const grilleMat = metal(0xb9bec6, 0.28, 1.0);
  const grilleWireMat = new MeshStandardMaterial({
    color: 0xd7dbe0,
    roughness: 0.4,
    metalness: 0.9,
    wireframe: true,
  });
  const goldMat = metal(0xd8a93f, 0.3, 1.0);
  const darkMat = metal(0x101214, 0.6, 0.4);
  const accentMat = new MeshStandardMaterial({
    color: 0x1f6feb,
    roughness: 0.4,
    metalness: 0.2,
    emissive: 0x1f6feb,
    emissiveIntensity: 0.55,
  });

  // --- Body (primary mass) ---
  const body = new Group();
  body.name = 'MicBody';
  const tube = mesh(new CylinderGeometry(0.026, 0.028, 0.13, 48), bodyMat, 'BodyTube');
  tube.position.y = -0.045;
  body.add(tube);
  const band = mesh(new TorusGeometry(0.0275, 0.0028, 16, 48), goldMat, 'TrimRing');
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.018;
  body.add(band);
  const badge = mesh(new BoxGeometry(0.02, 0.012, 0.002), goldMat, 'Badge');
  badge.position.set(0, -0.045, 0.0275);
  body.add(badge);
  root.add(body);

  // --- Grille head + capsule (secondary mass) ---
  const head = new Group();
  head.name = 'GrilleHead';
  const grille = mesh(new SphereGeometry(0.034, 48, 32), grilleMat, 'GrilleShell');
  grille.position.y = 0.062;
  grille.scale.y = 1.25;
  (grille.material as MeshStandardMaterial).transparent = true;
  (grille.material as MeshStandardMaterial).opacity = 0.55;
  head.add(grille);
  const grilleWire = mesh(new SphereGeometry(0.0345, 24, 16), grilleWireMat, 'GrilleMesh');
  grilleWire.position.y = 0.062;
  grilleWire.scale.y = 1.25;
  head.add(grilleWire);
  const collar = mesh(new CylinderGeometry(0.0275, 0.0275, 0.012, 48), darkMat, 'HeadCollar');
  collar.position.y = 0.026;
  head.add(collar);
  root.add(head);

  const capsule = new Group();
  capsule.name = 'DiaphragmCapsule';
  const disc = mesh(new CircleGeometry(0.02, 48), goldMat, 'Diaphragm');
  disc.position.set(0, 0.058, 0.012);
  capsule.add(disc);
  const capsuleBack = mesh(new CylinderGeometry(0.021, 0.021, 0.03, 32), darkMat, 'CapsuleHousing');
  capsuleBack.position.y = 0.045;
  capsule.add(capsuleBack);
  root.add(capsule);

  // --- XLR connector ---
  const xlr = new Group();
  xlr.name = 'XLRConnector';
  const xlrBody = mesh(new CylinderGeometry(0.011, 0.011, 0.03, 24), darkMat, 'XLRBarrel');
  xlrBody.position.y = -0.125;
  xlr.add(xlrBody);
  const xlrRing = mesh(new TorusGeometry(0.011, 0.002, 12, 24), grilleMat, 'XLRRing');
  xlrRing.rotation.x = Math.PI / 2;
  xlrRing.position.y = -0.112;
  xlr.add(xlrRing);
  root.add(xlr);

  // --- Switch + LED ---
  const controls = new Group();
  controls.name = 'ModeSwitch';
  const switchPlate = mesh(new BoxGeometry(0.012, 0.02, 0.002), darkMat, 'SwitchPlate');
  switchPlate.position.set(0, -0.08, 0.027);
  controls.add(switchPlate);
  const led = mesh(new SphereGeometry(0.0028, 12, 8), accentMat, 'StatusLED');
  led.position.set(0, -0.062, 0.0275);
  controls.add(led);
  root.add(controls);

  // --- Mount + stand (radially symmetric, safe on the turntable) ---
  const mount = new Group();
  mount.name = 'MountClip';
  const yoke = mesh(new TorusGeometry(0.036, 0.0035, 12, 40, Math.PI), darkMat, 'Yoke');
  yoke.position.y = -0.045;
  yoke.rotation.z = Math.PI;
  mount.add(yoke);
  const pole = mesh(new CylinderGeometry(0.006, 0.006, 0.09, 20), darkMat, 'StandPole');
  pole.position.y = -0.185;
  mount.add(pole);
  const base = mesh(new CylinderGeometry(0.045, 0.05, 0.012, 40), bodyMat, 'StandBase');
  base.position.y = -0.236;
  mount.add(base);
  root.add(mount);

  return root;
}

// Three.js space scene for the cockpit. Performance-tiered (spec §47).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STARTER_REGION } from '../../../shared/game-data/world';
import type { Ship } from '../../../shared/types';

function bodyPos(radius: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return new THREE.Vector3(radius * Math.cos(a), 0, radius * Math.sin(a));
}

export class SpaceScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raf = 0;
  private bodyMeshes = new Map<string, THREE.Mesh>();
  private shipMesh?: THREE.Group;
  private labels: { el: HTMLDivElement; pos: THREE.Vector3 }[] = [];
  private labelLayer: HTMLDivElement;

  constructor(container: HTMLDivElement, perf: 'low' | 'medium' | 'high' = 'medium') {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    this.renderer = new THREE.WebGLRenderer({ antialias: perf !== 'low', powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(perf === 'low' ? 1 : Math.min(window.devicePixelRatio, perf === 'high' ? 2 : 1.5));
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 5000);
    this.camera.position.set(0, 180, 260);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxDistance = 1200;

    // Starfield (reduced on low perf)
    const starCount = perf === 'low' ? 800 : perf === 'high' ? 4000 : 2000;
    const starGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 1500 + Math.random() * 1500;
      const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = r * Math.cos(p);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x8899cc, size: perf === 'low' ? 1.5 : 1.2, sizeAttenuation: false })));

    // Sun light
    this.scene.add(new THREE.AmbientLight(0x334466, 1.2));
    const sunLight = new THREE.PointLight(0xffddaa, 2, 3000);
    this.scene.add(sunLight);

    // Bodies
    const scale = 0.6; // region units -> three units
    for (const b of STARTER_REGION.bodies) {
      const p = bodyPos(b.orbitRadius * scale, b.orbitAngleDeg);
      const radius = Math.max(2, b.radius * 100 * (b.type === 'star' ? 1.5 : 1));
      const geo = b.type === 'asteroid_field'
        ? new THREE.IcosahedronGeometry(radius, 0)
        : b.type === 'station' || b.type === 'gate'
          ? new THREE.OctahedronGeometry(radius, 0)
          : new THREE.SphereGeometry(radius, perf === 'low' ? 12 : 24, perf === 'low' ? 8 : 16);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(b.color),
        emissive: b.type === 'star' ? new THREE.Color(b.color) : new THREE.Color(0x000000),
        emissiveIntensity: b.type === 'star' ? 1.2 : b.type === 'anomaly' ? 0.6 : 0,
        roughness: 0.8, metalness: 0.2,
        wireframe: b.type === 'anomaly',
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(p);
      mesh.userData.bodyId = b.id;
      this.scene.add(mesh);
      this.bodyMeshes.set(b.id, mesh);
      // Orbit ring
      if (b.orbitRadius > 0) {
        const ring = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(
            Array.from({ length: 64 }, (_, i) => {
              const a = (i / 64) * Math.PI * 2;
              return new THREE.Vector3(Math.cos(a) * b.orbitRadius * scale, 0, Math.sin(a) * b.orbitRadius * scale);
            })
          ),
          new THREE.LineBasicMaterial({ color: 0x2a3560, transparent: true, opacity: 0.5 })
        );
        this.scene.add(ring);
      }
    }

    // Ship marker
    this.shipMesh = new THREE.Group();
    const shipBody = new THREE.Mesh(new THREE.ConeGeometry(3, 10, 8), new THREE.MeshStandardMaterial({ color: 0x6FA8FF, emissive: 0x224488, emissiveIntensity: 0.6 }));
    shipBody.rotation.x = Math.PI / 2;
    this.shipMesh.add(shipBody);
    this.scene.add(this.shipMesh);

    // Label layer
    this.labelLayer = document.createElement('div');
    this.labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
    container.appendChild(this.labelLayer);
    for (const b of STARTER_REGION.bodies) {
      if (b.orbitRadius === 0) continue;
      const el = document.createElement('div');
      el.textContent = b.name;
      el.style.cssText = `position:absolute;font-size:10px;color:${b.realAstronomy ? '#55e0c0' : '#8F7CFF'};text-shadow:0 0 4px #000;transform:translate(-50%,-50%);white-space:nowrap;`;
      this.labelLayer.appendChild(el);
      this.labels.push({ el, pos: bodyPos(b.orbitRadius * scale, b.orbitAngleDeg) });
    }

    this.animate();
  }

  setShip(ship: Ship | undefined) {
    if (!ship || !this.shipMesh) return;
    const scale = 0.6;
    this.shipMesh.position.set(ship.position.x * scale, 2, ship.position.y * scale);
  }

  focusBody(bodyId: string) {
    const m = this.bodyMeshes.get(bodyId);
    if (m) {
      this.controls.target.copy(m.position);
      this.camera.position.set(m.position.x + 40, 30, m.position.z + 40);
    }
  }

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    this.controls.update();
    const t = performance.now() * 0.001;
    this.bodyMeshes.forEach((m) => { m.rotation.y = t * 0.1; });
    if (this.shipMesh) this.shipMesh.rotation.y = t * 0.5;
    // Update labels
    for (const l of this.labels) {
      const v = l.pos.clone().project(this.camera);
      if (v.z > 1) { l.el.style.display = 'none'; continue; }
      l.el.style.display = '';
      const rect = this.renderer.domElement.getBoundingClientRect();
      l.el.style.left = `${(v.x * 0.5 + 0.5) * rect.width}px`;
      l.el.style.top = `${(-v.y * 0.5 + 0.5) * rect.height}px`;
    }
    this.renderer.render(this.scene, this.camera);
  };

  resize() {
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;
    const w = parent.clientWidth, h = parent.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.controls.dispose();
    this.renderer.dispose();
    this.labelLayer.remove();
    this.renderer.domElement.remove();
  }
}

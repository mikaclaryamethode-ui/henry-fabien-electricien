(() => {
  'use strict';

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── 1. APPARITIONS AU DÉFILEMENT ───
  const revealEls = document.querySelectorAll('.reveal');
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('visible'));
  } else {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealEls.forEach((el) => revealObs.observe(el));
  }

  // ─── 2. RADAR 3D DE LA ZONE D'INTERVENTION (THREE.JS) ───
  function initHoloMap() {
    const wrapper = document.getElementById('holo-map-container');
    const canvasWrapper = document.getElementById('holo-canvas');
    const labelWrapper = document.getElementById('holo-labels');
    const toggleBtn = document.getElementById('radar-toggle');
    if (!wrapper || !canvasWrapper || typeof THREE === 'undefined') return;

    const W = wrapper.clientWidth || 380;
    const H = wrapper.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 10, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    canvasWrapper.appendChild(renderer.domElement);

    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    const grid = new THREE.GridHelper(16, 16, 0x58c7e8, 0x4e6a84);
    [].concat(grid.material).forEach((m) => {
      m.transparent = true;
      m.opacity = 0.14;
    });
    mapGroup.add(grid);

    for (let r = 2; r <= 8; r += 2) {
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x58c7e8, transparent: true, opacity: 0.12 });
      mapGroup.add(new THREE.Line(geo, mat));
    }

    const cities = [
      { name: 'Lanne-en-Barétous', pos: new THREE.Vector3(-3, 0, 3), isCenter: true, domId: 'city-lanne' },
      { name: 'Mauléon', pos: new THREE.Vector3(-5, 0, 1.5), delay: 0.5, domId: 'city-mauleon' },
      { name: 'Oloron', pos: new THREE.Vector3(-0.5, 0, 1.5), delay: 1.2, domId: 'city-oloron' },
      { name: 'Arette', pos: new THREE.Vector3(-2.0, 0, 6.0), delay: 1.9, domId: 'city-arette' },
      { name: 'Navarrenx', pos: new THREE.Vector3(-2.5, 0, -1), delay: 2.6, domId: 'city-navarrenx' },
      { name: 'La Pierre St-M.', pos: new THREE.Vector3(-1.5, 0, 7.8), delay: 3.3, domId: 'city-lapierresm' },
      { name: 'Arudy', pos: new THREE.Vector3(1.8, 0, 0.5), delay: 4.0, domId: 'city-arudy' },
      { name: 'Mourenx', pos: new THREE.Vector3(1.5, 0, -3.0), delay: 4.7, domId: 'city-mourenx' },
      { name: 'Orthez', pos: new THREE.Vector3(-1, 0, -4.5), delay: 5.4, domId: 'city-orthez' },
      { name: 'Pau', pos: new THREE.Vector3(4, 0, -2), delay: 6.1, domId: 'city-pau' }
    ];

    const cityObjects = [];
    const arcs = [];
    const centerPos = cities[0].pos;

    cities.forEach((city) => {
      const geo = new THREE.SphereGeometry(city.isCenter ? 0.28 : 0.14, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: city.isCenter ? 0xF5A623 : 0x4e6a84,
        transparent: !city.isCenter,
        opacity: city.isCenter ? 1 : 0.55
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(city.pos);
      mapGroup.add(mesh);

      if (city.isCenter) {
        const haloGeo = new THREE.SphereGeometry(0.42, 24, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xF5A623,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending
        });
        mesh.add(new THREE.Mesh(haloGeo, haloMat));
      }

      const label = document.createElement('div');
      label.className = 'city-label' + (city.isCenter ? ' center-city' : '');
      label.textContent = city.name;
      labelWrapper.appendChild(label);

      const domEl = document.getElementById(city.domId);
      cityObjects.push({ data: city, mesh, label, domEl });

      if (!city.isCenter) {
        const mid = new THREE.Vector3(
          (centerPos.x + city.pos.x) / 2,
          centerPos.distanceTo(city.pos) * 0.38,
          (centerPos.z + city.pos.z) / 2
        );
        const curve = new THREE.QuadraticBezierCurve3(centerPos, mid, city.pos);
        const points = curve.getPoints(50);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
        arcGeo.setDrawRange(0, REDUCED_MOTION ? 50 : 0);
        const arcMat = new THREE.LineBasicMaterial({
          color: 0xF5A623,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(arcGeo, arcMat);
        mapGroup.add(line);
        arcs.push({
          line,
          arcGeo,
          targetCity: cityObjects[cityObjects.length - 1],
          delay: city.delay,
          progress: REDUCED_MOTION ? 1 : 0
        });
      }
    });

    function projectLabels() {
      const halfW = wrapper.clientWidth / 2;
      const halfH = wrapper.clientHeight / 2;
      cityObjects.forEach((obj) => {
        const worldPos = new THREE.Vector3();
        obj.mesh.getWorldPosition(worldPos);
        worldPos.project(camera);
        obj.label.style.left = (worldPos.x * halfW + halfW) + 'px';
        obj.label.style.top = (-worldPos.y * halfH + halfH) + 'px';
      });
    }

    if (REDUCED_MOTION) {
      cityObjects.forEach((obj) => {
        obj.label.classList.add('active');
        if (!obj.data.isCenter) {
          obj.mesh.material.color.setHex(0x58c7e8);
          obj.mesh.material.opacity = 1;
        }
      });
      if (toggleBtn) toggleBtn.style.display = 'none';
      renderer.render(scene, camera);
      projectLabels();
      return;
    }

    let isPaused = false;
    let elapsed = 0;
    let lastTs = 0;
    const loopDuration = 9.0;

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        toggleBtn.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
        toggleBtn.textContent = isPaused ? 'Relancer le radar' : 'Mettre le radar en pause';
        if (!isPaused) lastTs = performance.now();
      });
    }

    function animate(ts) {
      requestAnimationFrame(animate);
      if (isPaused) return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.1);
      lastTs = ts;
      elapsed += dt;

      const cycleTime = elapsed % loopDuration;
      mapGroup.rotation.y = elapsed * 0.12;
      mapGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.05;
      mapGroup.rotation.z = Math.cos(elapsed * 0.3) * 0.05;

      const pulse = 1 + Math.sin(elapsed * 4) * 0.08;
      cityObjects[0].mesh.scale.setScalar(pulse);

      const isActivePhase = cycleTime < loopDuration - 0.4;
      if (cityObjects[0].domEl) {
        cityObjects[0].domEl.classList.toggle('active', isActivePhase);
      }

      arcs.forEach((arc) => {
        if (isActivePhase && cycleTime > arc.delay) {
          arc.progress = Math.min((cycleTime - arc.delay) * 2.2, 1.0);
        } else {
          arc.progress = 0;
          arc.targetCity.mesh.material.color.setHex(0x4e6a84);
          arc.targetCity.mesh.material.opacity = 0.55;
          if (arc.targetCity.domEl) arc.targetCity.domEl.classList.remove('active');
          arc.targetCity.label.classList.remove('active');
        }

        arc.arcGeo.setDrawRange(0, Math.round(arc.progress * 50));

        if (arc.progress >= 1.0) {
          arc.targetCity.mesh.material.color.setHex(0x58c7e8);
          arc.targetCity.mesh.material.opacity = 1.0;
          if (arc.targetCity.domEl) arc.targetCity.domEl.classList.add('active');
          arc.targetCity.label.classList.add('active');
        }
      });

      projectLabels();
      renderer.render(scene, camera);
    }

    const mapObs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          requestAnimationFrame(animate);
          mapObs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    mapObs.observe(wrapper);

    window.addEventListener('resize', () => {
      const nW = wrapper.clientWidth;
      const nH = wrapper.clientHeight;
      if (!nW || !nH) return;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      projectLabels();
    });
  }

  window.addEventListener('load', () => {
    try {
      initHoloMap();
    } catch (err) {
      console.error('Erreur radar 3D:', err);
    }
  });

  // ─── 3. RETOUR EN HAUT ───
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener(
      'scroll',
      () => {
        backToTop.classList.toggle('visible', window.scrollY > 320);
      },
      { passive: true }
    );
  }
})();

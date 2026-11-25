(() => {
  'use strict';

  const PHONE_RAW = '+33625170665';
  const STORAGE_KEY = 'hf_intervention_v23';
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── 1. APPARITIONS REJOUÉES AU SCROLL (DESCENTE & REMONTÉE) ───
  const revealEls = document.querySelectorAll('.reveal');
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('visible'));
  } else {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else if (entry.boundingClientRect.top > window.innerHeight * 0.92) {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.08 }
    );
    revealEls.forEach((el) => revealObs.observe(el));
  }

  // ─── 2. PROGRESSION DU COURANT AU SCROLL (HEADER + FIL PRESTATIONS + PARALLAXE) ───
  const railFill = document.getElementById('scroll-rail-fill');
  const wireWrap = document.getElementById('services-track-wrap');
  const wireFill = document.getElementById('services-wire-fill');
  const serviceRows = Array.from(document.querySelectorAll('.service-row'));
  const heroProof = document.getElementById('hero-proof');
  const backToTop = document.getElementById('back-to-top');
  let scrollYOffset = 0;

  function updateScrollEffects() {
    scrollYOffset = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (railFill && docHeight > 0) {
      const pct = Math.min(100, Math.max(0, (scrollYOffset / docHeight) * 100));
      railFill.style.width = pct.toFixed(1) + '%';
    }

    if (backToTop) {
      backToTop.classList.toggle('visible', scrollYOffset > 320);
    }

    if (heroProof && !REDUCED_MOTION && window.innerWidth > 960) {
      const shift = Math.min(40, scrollYOffset * 0.08);
      heroProof.style.transform = `translateY(${shift.toFixed(1)}px)`;
    }

    if (wireWrap && wireFill) {
      const rect = wireWrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const triggerY = vh * 0.62;
      const progress = Math.min(1, Math.max(0, (triggerY - rect.top) / Math.max(1, rect.height)));
      wireFill.style.height = (progress * 100).toFixed(1) + '%';

      serviceRows.forEach((row) => {
        const r = row.getBoundingClientRect();
        const rowCenter = r.top + r.height * 0.5;
        const lit = rowCenter <= triggerY + 70 && r.bottom >= vh * 0.12;
        row.classList.toggle('is-lit', lit);
      });
    }
  }

  window.addEventListener('scroll', updateScrollEffects, { passive: true });
  window.addEventListener('resize', updateScrollEffects, { passive: true });
  updateScrollEffects();

  // Spotlight doux sur les rangées de prestations
  serviceRows.forEach((row) => {
    row.addEventListener('mousemove', (e) => {
      const r = row.getBoundingClientRect();
      row.style.setProperty('--mx', `${e.clientX - r.left}px`);
      row.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // ─── 3. COMPTEUR 25 ANS VIVANT ───
  const counterEl = document.getElementById('experience-counter');
  if (counterEl && !REDUCED_MOTION) {
    let played = false;
    const runCounter = () => {
      if (played) return;
      played = true;
      const target = 25;
      const start = performance.now();
      const duration = 1100;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        counterEl.textContent = String(Math.max(1, Math.round(eased * target)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    runCounter();
  }

  // ─── 4. RÉSEAU ÉLECTRIQUE THREE.JS DANS LE HERO (RÉACTIF SOURIS + SCROLL) ───
  const heroSection = document.getElementById('hero-section');
  const heroGlow = document.getElementById('hero-glow');
  const mouseWorld = { x: 0, y: 0, active: false };

  if (heroSection && !REDUCED_MOTION) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (heroGlow) {
        heroGlow.style.left = x + 'px';
        heroGlow.style.top = y + 'px';
      }
      mouseWorld.x = (x - rect.width / 2) * 0.34;
      mouseWorld.y = -(y - rect.height / 2) * 0.34;
      mouseWorld.active = true;
    });
    heroSection.addEventListener('mouseleave', () => {
      mouseWorld.active = false;
    });
  }

  function initHeroNetwork() {
    if (!heroSection || typeof THREE === 'undefined' || REDUCED_MOTION) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'hero-particles';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1';
    canvas.style.pointerEvents = 'none';
    heroSection.insertBefore(canvas, heroSection.firstChild);

    const width = heroSection.clientWidth || window.innerWidth;
    const height = heroSection.offsetHeight || 640;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.z = 155;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const count = 72;
    const positions = new Float32Array(count * 3);
    const nodes = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 390;
      const y = (Math.random() - 0.5) * 250;
      const z = (Math.random() - 0.5) * 90 - 40;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      nodes.push({ baseX: x, baseY: y, baseZ: z, cx: x, cy: y });
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x4e6a84, size: 2.5, transparent: true, opacity: 0.65 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xF5A623, transparent: true, opacity: 0.16 });
    const lines = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat);
    scene.add(lines);

    function animate() {
      requestAnimationFrame(animate);
      const t = performance.now() * 0.0005;
      const posAttr = points.geometry.attributes.position.array;
      const segs = [];

      for (let i = 0; i < count; i++) {
        const n = nodes[i];
        let tx = n.baseX + Math.sin(t + i) * 10;
        let ty = n.baseY + Math.cos(t + i * 1.35) * 10 - scrollYOffset * 0.25;

        if (mouseWorld.active) {
          const dx = n.cx - mouseWorld.x;
          const dy = n.cy - mouseWorld.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.1 && dist < 72) {
            const force = (72 - dist) / 72;
            tx += (dx / dist) * force * 34;
            ty += (dy / dist) * force * 34;
          }
        }

        n.cx += (tx - n.cx) * 0.05;
        n.cy += (ty - n.cy) * 0.05;
        posAttr[i * 3] = n.cx;
        posAttr[i * 3 + 1] = n.cy;
        posAttr[i * 3 + 2] = n.baseZ;

        for (let j = i + 1; j < count; j++) {
          const n2 = nodes[j];
          const dx = n.cx - n2.cx;
          const dy = n.cy - n2.cy;
          const dz = n.baseZ - n2.baseZ;
          if (dx * dx + dy * dy + dz * dz < 2900) {
            segs.push(n.cx, n.cy, n.baseZ, n2.cx, n2.cy, n2.baseZ);
          }
        }
      }

      points.geometry.attributes.position.needsUpdate = true;
      lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
      lineMat.opacity = Math.max(0, 0.16 - scrollYOffset * 0.0003);
      pMat.opacity = Math.max(0, 0.65 - scrollYOffset * 0.0007);
      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      const nw = heroSection.clientWidth;
      const nh = heroSection.offsetHeight;
      if (!nw || !nh) return;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });
  }

  // ─── 5. RADAR 3D DE LA ZONE D'INTERVENTION (THREE.JS) ───
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
      initHeroNetwork();
    } catch (err) {
      console.error('Erreur réseau hero:', err);
    }
    try {
      initHoloMap();
    } catch (err) {
      console.error('Erreur radar 3D:', err);
    }
  });

  // ─── 6. FORMULAIRE PRÉ-MESSAGE CLIENT TERRAIN ───
  const form = document.getElementById('intervention-form');
  const nameInput = document.getElementById('client-name');
  const phoneInput = document.getElementById('client-phone');
  const citySelect = document.getElementById('client-city');
  const slotSelect = document.getElementById('client-slot');
  const slotDetailWrap = document.getElementById('precise-slot-wrap');
  const slotDetailInput = document.getElementById('client-slot-detail');
  const addressInput = document.getElementById('client-address');
  const accessInput = document.getElementById('client-access');
  const noteInput = document.getElementById('client-note');
  const errorBox = document.getElementById('form-error');
  const previewText = document.getElementById('preview-text');
  const deviceHint = document.getElementById('device-hint');
  const btnSms = document.getElementById('btn-sms');
  const btnCopy = document.getElementById('btn-copy');
  const feedbackBox = document.getElementById('form-feedback');
  const feedbackMessage = document.getElementById('feedback-message');
  const btnReset = document.getElementById('btn-reset');

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

  if (deviceHint && btnSms) {
    if (isMobile) {
      deviceHint.textContent = "Sur téléphone : le bouton ouvre votre application SMS avec le message prêt à envoyer.";
      btnSms.textContent = 'Envoyer le SMS à Fabien';
    } else {
      deviceHint.textContent = "Sur ordinateur : copiez le message ou appelez directement le 06 25 17 06 65.";
      btnSms.textContent = 'Ouvrir SMS (si configuré)';
    }
  }

  function toAsciiGsm(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’‘]/g, "'")
      .replace(/[—–]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getSelectedMode() {
    const checked = form ? form.querySelector('input[name="mode"]:checked') : null;
    return checked ? checked.value : 'URGENCE';
  }

  function buildMessage() {
    const mode = getSelectedMode();
    const name = toAsciiGsm(nameInput.value);
    const phone = toAsciiGsm(phoneInput.value);
    const city = toAsciiGsm(citySelect.value);
    const slotBase = slotSelect.value;
    const slot =
      slotBase === 'Creneau precis' && slotDetailInput.value.trim()
        ? toAsciiGsm(slotDetailInput.value)
        : toAsciiGsm(slotBase);
    const address = toAsciiGsm(addressInput.value);
    const access = toAsciiGsm(accessInput.value);
    const note = toAsciiGsm(noteInput.value);

    const lines = [
      `[${mode}] ${name || 'Nom a preciser'} - ${city || 'Commune'} - ${slot}`,
      `Tel : ${phone || 'a preciser'}`,
      `Adresse : ${address || 'a preciser'}${access ? ' (' + access + ')' : ''}`
    ];

    if (note) lines.push(`Detail : ${note}`);
    return lines.join('\n');
  }

  function updatePreview() {
    if (!previewText) return;
    if (slotDetailWrap) {
      slotDetailWrap.classList.toggle('is-hidden', slotSelect.value !== 'Creneau precis');
    }
    previewText.textContent = buildMessage();
  }

  function clearError() {
    if (!errorBox) return;
    errorBox.textContent = '';
    errorBox.classList.remove('is-visible');
  }

  function showError(msg, focusEl) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.add('is-visible');
    }
    if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
  }

  function validateForm() {
    clearError();
    if (!nameInput.value.trim()) {
      showError('Indiquez votre prénom et nom afin que Fabien sache qui rappeler.', nameInput);
      return false;
    }
    if (phoneInput.value.replace(/\D/g, '').length < 10) {
      showError('Indiquez un numéro de téléphone valide (10 chiffres) pour le rappel.', phoneInput);
      return false;
    }
    if (!citySelect.value) {
      showError('Choisissez la commune d’intervention dans la liste.', citySelect);
      return false;
    }
    if (slotSelect.value === 'Creneau precis' && !slotDetailInput.value.trim()) {
      showError('Précisez la date ou le créneau souhaité.', slotDetailInput);
      return false;
    }
    if (!addressInput.value.trim()) {
      showError('Indiquez la rue et le numéro pour préparer l’intervention.', addressInput);
      return false;
    }
    return true;
  }

  function showFeedback(text) {
    if (!feedbackBox || !feedbackMessage) return;
    feedbackMessage.textContent = text;
    feedbackBox.classList.remove('is-hidden');
  }

  function saveState() {
    if (!form) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: getSelectedMode(),
          name: nameInput.value,
          phone: phoneInput.value,
          city: citySelect.value,
          slot: slotSelect.value,
          slotDetail: slotDetailInput.value,
          address: addressInput.value,
          access: accessInput.value,
          note: noteInput.value
        })
      );
    } catch (_e) {
      // ignore
    }
  }

  function restoreState() {
    if (!form) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.mode) {
        const radio = form.querySelector(`input[name="mode"][value="${d.mode}"]`);
        if (radio) radio.checked = true;
      }
      if (typeof d.name === 'string') nameInput.value = d.name;
      if (typeof d.phone === 'string') phoneInput.value = d.phone;
      if (typeof d.city === 'string') citySelect.value = d.city;
      if (typeof d.slot === 'string') slotSelect.value = d.slot;
      if (typeof d.slotDetail === 'string') slotDetailInput.value = d.slotDetail;
      if (typeof d.address === 'string') addressInput.value = d.address;
      if (typeof d.access === 'string') accessInput.value = d.access;
      if (typeof d.note === 'string') noteInput.value = d.note;
    } catch (_e) {
      // ignore
    }
  }

  // Raccourcis depuis Prestations et Zone vers le pré-message
  document.querySelectorAll('[data-set-mode]').forEach((link) => {
    link.addEventListener('click', () => {
      const mode = link.getAttribute('data-set-mode');
      const radio = form ? form.querySelector(`input[name="mode"][value="${mode}"]`) : null;
      if (radio) {
        radio.checked = true;
        updatePreview();
        saveState();
      }
    });
  });

  document.querySelectorAll('.commune-item[data-city-name]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cityVal = btn.getAttribute('data-city-name');
      if (citySelect && cityVal) {
        citySelect.value = cityVal;
        updatePreview();
        saveState();
        const section = document.getElementById('demande');
        if (section) section.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
      }
    });
  });

  if (form) {
    restoreState();
    updatePreview();

    form.addEventListener('input', () => {
      clearError();
      updatePreview();
      saveState();
    });

    form.addEventListener('change', () => {
      clearError();
      updatePreview();
      saveState();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      const body = encodeURIComponent(buildMessage());
      const separator = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?';
      window.location.href = `sms:${PHONE_RAW}${separator}body=${body}`;
      showFeedback(
        'Votre application SMS a été ouverte. L’intervention est confirmée uniquement après réponse ou rappel de Fabien.'
      );
    });

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        if (!validateForm()) return;
        const text = buildMessage();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showFeedback('Message copié. Envoyez-le par SMS au 06 25 17 06 65. Confirmation après rappel de Fabien.');
          } else {
            showFeedback('Sélectionnez le texte dans l’aperçu ci-contre et envoyez-le au 06 25 17 06 65.');
          }
        } catch (_e) {
          showFeedback('Sélectionnez le texte dans l’aperçu ci-contre et envoyez-le au 06 25 17 06 65.');
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        form.reset();
        clearError();
        if (feedbackBox) feedbackBox.classList.add('is-hidden');
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch (_e) {
          // ignore
        }
        updatePreview();
        nameInput.focus();
      });
    }
  }
})();

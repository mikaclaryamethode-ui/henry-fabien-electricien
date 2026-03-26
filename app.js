// ─── SCROLL REVEAL ───
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // ─── EFFET COURT-CIRCUIT SUR TITRE ───
    function typewriterElectric(element) {
      element.style.opacity = '1';
      element.style.animation = 'glitchReveal 1.2s ease-out forwards';
    }

    // ─── FOND THREE.JS RESEAU ELECTRIQUE ───
    let heroScene, heroCamera, heroRenderer, heroParticles, heroLines, heroNodes = [];
    let mouseVector = { x: 0, y: 0 }; // Plain object — THREE pas encore dispo ici (defer)

    function initElectricalGrid() {
      const hero = document.getElementById('hero-section');
      if (!hero || typeof THREE === 'undefined') return;

      const canvas = document.createElement('canvas');
      canvas.id = 'hero-particles';
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.top = '0';
      canvas.style.zIndex = '0';
      canvas.style.pointerEvents = 'none';
      hero.insertBefore(canvas, hero.firstChild);

      heroScene = new THREE.Scene();
      heroCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      heroCamera.position.z = 150;

      heroRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      heroRenderer.setSize(window.innerWidth, hero.offsetHeight);
      heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const particleCount = 80;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        // Position aléatoire sur les axes X, Y, dispersés sur -150 à +150
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 100 - 50; // Profondeur

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        heroNodes.push({
          baseX: x, baseY: y, baseZ: z,
          current: new THREE.Vector3(x, y, z),
          target: new THREE.Vector3(x, y, z),
          vx: 0, vy: 0 // Vélocité pour le champ de force
        });
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const pMaterial = new THREE.PointsMaterial({
        color: 0x4e6a84,
        size: 2.5,
        transparent: true,
        opacity: 0.6
      });

      heroParticles = new THREE.Points(geometry, pMaterial);
      heroScene.add(heroParticles);

      // Lignes de connexion
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xF5A623,
        transparent: true,
        opacity: 0.15
      });
      heroLines = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat);
      heroScene.add(heroLines);

      animateElectricalGrid();
    }

    let scrollYOffset = 0;

    function animateElectricalGrid() {
      requestAnimationFrame(animateElectricalGrid);

      const positions = heroParticles.geometry.attributes.position.array;
      const linesPositions = [];
      const linesColors = [];

      // Update des positions (interaction souris + décharge au scroll)
      for (let i = 0; i < heroNodes.length; i++) {
        const node = heroNodes[i];

        // Mouvement de base lent (flottement)
        const time = Date.now() * 0.0005;
        node.target.x = node.baseX + Math.sin(time + i) * 10;
        node.target.y = node.baseY + Math.cos(time + i * 1.5) * 10 - scrollYOffset * 0.5; // Discharge vers le bas au scroll

        // Interaction souris : force répulsive
        if (mouseVector.x !== 0 && mouseVector.y !== 0) {
          const dx = node.current.x - mouseVector.x;
          const dy = node.current.y - mouseVector.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            const force = (60 - dist) / 60;
            node.target.x += (dx / dist) * force * 30;
            node.target.y += (dy / dist) * force * 30;
          }
        }

        // Interpolation douce
        node.current.x += (node.target.x - node.current.x) * 0.02;
        node.current.y += (node.target.y - node.current.y) * 0.02;

        positions[i * 3] = node.current.x;
        positions[i * 3 + 1] = node.current.y;
        positions[i * 3 + 2] = node.current.z;

        // Lignes de connexion
        for (let j = i + 1; j < heroNodes.length; j++) {
          const node2 = heroNodes[j];
          const dx = node.current.x - node2.current.x;
          const dy = node.current.y - node2.current.y;
          const dz = node.current.z - node2.current.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          const maxDist = 3000;
          if (distSq < maxDist) {
            linesPositions.push(
              node.current.x, node.current.y, node.current.z,
              node2.current.x, node2.current.y, node2.current.z
            );
          }
        }
      }

      heroParticles.geometry.attributes.position.needsUpdate = true;
      heroLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linesPositions, 3));
      heroLines.material.opacity = Math.max(0, 0.15 - (scrollYOffset * 0.0005));
      heroParticles.material.opacity = Math.max(0, 0.6 - (scrollYOffset * 0.001));

      heroRenderer.render(heroScene, heroCamera);
    }

    // ─── INIT SYSTEMES HERO ET CARTE ───
    window.addEventListener('load', () => {
      // Démarrage Map
      try {
        initHoloMap();
      } catch (e) {
        console.error("Erreur initHoloMap:", e);
      }

      // Init Particles
      try {
        initElectricalGrid();
      } catch (e) {
        console.error("Erreur initElectricalGrid:", e);
      }

      // Effet Typed Titre (léger délai)
      setTimeout(() => {
        try {
          const titleEl = document.getElementById('hero-title');
          if (titleEl) typewriterElectric(titleEl);
        } catch (e) {
          console.error("Erreur typewriterElectric:", e);
        }
      }, 500);

      // Init Eclair désactivé

      // ─── COMPTEUR 25 ANS & EFFET TILT ───
      try {
        const tiltEl = document.querySelector('.badge-tilt');
        const counterEl = document.getElementById('experience-counter');
        const textEl = document.getElementById('experience-text');

        if (tiltEl && typeof VanillaTilt !== 'undefined') {
          // Initialiser Vanilla-Tilt
          VanillaTilt.init(tiltEl, {
            max: 12,
            speed: 600,
            glare: true,
            'max-glare': 0.12,
            perspective: 1000,
            scale: 1.03,
            gyroscope: true
          });
        }

        let counterStarted = false;
        const startCounter = () => {
          if (counterStarted || !counterEl) return;
          counterStarted = true;
          let count = 0;
          const target = 25;
          const duration = 3500; // ms
          const incrementTime = Math.floor(duration / target);

          const timer = setInterval(() => {
            count++;
            if (counterEl) counterEl.textContent = count;
            if (count >= target) {
              clearInterval(timer);
              if (textEl) textEl.classList.add('visible');
            }
          }, incrementTime);
        };

        const counterObserver = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            startCounter();
            counterObserver.disconnect();
          }
        }, { threshold: 0.5 });

        if (tiltEl) {
          counterObserver.observe(tiltEl);
        }
      } catch (e) {
        console.error("Erreur Compteur/Tilt:", e);
      }
    });

    // ─── GLOW SOURIS HERO ET CARTES SERVICES ───
    const heroSection = document.getElementById('hero-section');
    const heroGlow = document.getElementById('hero-glow');
    if (heroSection && heroGlow) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        heroGlow.style.left = x + 'px';
        heroGlow.style.top = y + 'px';

        // Mettre à jour la position souris pour ThreeJS particles
        // Transformation canvas coordinates to world coordinates (-X to X, Y to -Y)
        if (typeof heroCamera !== 'undefined') {
          // On fait une approximation simple pour que les points réagissent au curseur 2D
          mouseVector.x = (x - rect.width / 2) * 0.3;
          mouseVector.y = -(y - rect.height / 2) * 0.3;
        }
      });
      // Sortie du curseur
      heroSection.addEventListener('mouseleave', () => {
        mouseVector.x = 0;
        mouseVector.y = 0;
      });
    }

    // ─── SCROLL DISCHARGE CAPTURE ───
    window.addEventListener('scroll', () => {
      scrollYOffset = window.scrollY;
    }, { passive: true });

    // Effet Spotlight sur les cartes de service
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });

    // ─── CARTE 3D THREE.JS ───
    function initHoloMap() {
      const wrapper = document.getElementById('holo-map-container');
      const canvasWrapper = document.getElementById('holo-canvas');
      const labelWrapper = document.getElementById('holo-labels');
      if (!wrapper || !canvasWrapper || typeof THREE === 'undefined') return;

      // On lit les dimensions après que le DOM est visible
      const W = wrapper.clientWidth || 380;
      const H = wrapper.clientHeight || 380;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
      camera.position.set(0, 10, 14);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.display = 'block'; // évite pixel fantôme
      canvasWrapper.appendChild(renderer.domElement);

      const mapGroup = new THREE.Group();
      scene.add(mapGroup);

      // GridHelper r128 : material est un tableau [centerMat, gridMat]
      const grid = new THREE.GridHelper(16, 16, 0x00f3ff, 0x4e6a84);
      [].concat(grid.material).forEach(m => { m.transparent = true; m.opacity = 0.12; });
      mapGroup.add(grid);

      // Cercles concentriques manuels pour l'effet radar
      for (let r = 2; r <= 8; r += 2) {
        const pts = [];
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.08 });
        mapGroup.add(new THREE.Line(geo, mat));
      }

      const cities = [
        { name: 'Lanne-en-Barétous', pos: new THREE.Vector3(-3, 0, 3),    isCenter: true, tagId: 'tag-lanne' },
        { name: 'Mauléon',           pos: new THREE.Vector3(-5, 0, 1.5),   delay: 0.5,  tagId: 'tag-mauleon' },
        { name: 'Oloron',            pos: new THREE.Vector3(-0.5, 0, 1.5), delay: 1.2,  tagId: 'tag-oloron' },
        { name: 'Arette',            pos: new THREE.Vector3(-2.0, 0, 6.0), delay: 1.9,  tagId: 'tag-arette' },
        { name: 'Navarrenx',         pos: new THREE.Vector3(-2.5, 0, -1),  delay: 2.6,  tagId: 'tag-navarrenx' },
        { name: 'La Pierre St-M.',   pos: new THREE.Vector3(-1.5, 0, 7.8), delay: 3.3,  tagId: 'tag-lapierresm' },
        { name: 'Arudy',             pos: new THREE.Vector3(1.8, 0, 0.5),  delay: 4.0,  tagId: 'tag-arudy' },
        { name: 'Mourenx',           pos: new THREE.Vector3(1.5, 0, -3.0), delay: 4.7,  tagId: 'tag-mourenx' },
        { name: 'Orthez',            pos: new THREE.Vector3(-1, 0, -4.5),  delay: 5.4,  tagId: 'tag-orthez' },
        { name: 'Pau',               pos: new THREE.Vector3(4, 0, -2),     delay: 6.1,  tagId: 'tag-pau' }
      ];

      const cityObjects = [];
      const arcs = [];
      const centerPos = cities[0].pos;

      cities.forEach(city => {
        const geo = new THREE.SphereGeometry(city.isCenter ? 0.28 : 0.14, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
          color: city.isCenter ? 0xF5A623 : 0x4e6a84,
          transparent: !city.isCenter,
          opacity: city.isCenter ? 1 : 0.5
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(city.pos);
        mapGroup.add(mesh);

        // Halo pour la ville centre — couleur orange, amplitude réduite
        if (city.isCenter) {
          const haloGeo = new THREE.SphereGeometry(0.42, 24, 24);
          const haloMat = new THREE.MeshBasicMaterial({ color: 0xF5A623, transparent: true, opacity: 0.20, blending: THREE.AdditiveBlending });
          mesh.add(new THREE.Mesh(haloGeo, haloMat));
        }

        // Label DOM
        const label = document.createElement('div');
        label.className = 'city-label' + (city.isCenter ? ' center-city' : '');
        label.textContent = city.name;
        labelWrapper.appendChild(label);

        const domTag = document.getElementById(city.tagId);
        cityObjects.push({ data: city, mesh, label, domTag });

        // Arc vers les villes secondaires
        if (!city.isCenter) {
          const mid = new THREE.Vector3(
            (centerPos.x + city.pos.x) / 2,
            centerPos.distanceTo(city.pos) * 0.38,
            (centerPos.z + city.pos.z) / 2
          );
          const curve = new THREE.QuadraticBezierCurve3(centerPos, mid, city.pos);
          const points = curve.getPoints(50);
          const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
          arcGeo.setDrawRange(0, 0);
          const arcMat = new THREE.LineBasicMaterial({
            color: 0xF5A623, transparent: true, opacity: 0.75,
            blending: THREE.AdditiveBlending
          });
          const line = new THREE.Line(arcGeo, arcMat);
          mapGroup.add(line);
          arcs.push({ line, arcGeo, targetCity: cityObjects[cityObjects.length - 1], delay: city.delay, progress: 0 });
        }
      });

      const clock = new THREE.Clock();
      const loopDuration = 9.0;

      function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const cycleTime = time % loopDuration;
        const halfW = wrapper.clientWidth / 2;
        const halfH = wrapper.clientHeight / 2;

        // Rotation lente
        mapGroup.rotation.y = time * 0.12;
        mapGroup.rotation.x = Math.sin(time * 0.5) * 0.05;
        mapGroup.rotation.z = Math.cos(time * 0.3) * 0.05;

        // Pulsation ville centre
        const pulse = 1 + Math.sin(time * 4) * 0.08;
        cityObjects[0].mesh.scale.setScalar(pulse);

        // Tag Lanne allumé dès le début du cycle, éteint à la fin
        const isActivePhase = cycleTime < loopDuration - 0.4;
        const centerTag = cityObjects[0].domTag;
        if (centerTag) {
          centerTag.classList.toggle('active', isActivePhase);
        }

        // Progression des arcs et synchronisation des étiquettes
        arcs.forEach(arc => {
          if (isActivePhase && cycleTime > arc.delay) {
            arc.progress = Math.min((cycleTime - arc.delay) * 2.2, 1.0);
          } else {
            // Réinitialisation en fin de cycle ou avant le délai de départ
            arc.progress = 0;
            arc.targetCity.mesh.material.color.setHex(0x4e6a84);
            arc.targetCity.mesh.material.opacity = 0.5;
            if (arc.targetCity.domTag) arc.targetCity.domTag.classList.remove('active');
            arc.targetCity.label.classList.remove('active');
          }

          arc.arcGeo.setDrawRange(0, Math.round(arc.progress * 50));

          if (arc.progress >= 1.0) {
            arc.targetCity.mesh.material.color.setHex(0x00f3ff);
            arc.targetCity.mesh.material.opacity = 1.0;
            if (arc.targetCity.domTag) arc.targetCity.domTag.classList.add('active');
            arc.targetCity.label.classList.add('active');
          }
        });

        // Projection labels 2D
        cityObjects.forEach(obj => {
          const worldPos = new THREE.Vector3();
          obj.mesh.getWorldPosition(worldPos);
          worldPos.project(camera);
          obj.label.style.left = (worldPos.x * halfW + halfW) + 'px';
          obj.label.style.top = (-worldPos.y * halfH + halfH) + 'px';
        });

        renderer.render(scene, camera);
      }

      // Démarre l'animation quand la section est visible
      const mapObs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { animate(); mapObs.disconnect(); }
      }, { threshold: 0.1 });
      mapObs.observe(wrapper);

      // Resize
      window.addEventListener('resize', () => {
        const nW = wrapper.clientWidth;
        const nH = wrapper.clientHeight;
        renderer.setSize(nW, nH);
        camera.aspect = nW / nH;
        camera.updateProjectionMatrix();
      });
    }


    // ─── BACK TO TOP ───
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      }, { passive: true });
    }
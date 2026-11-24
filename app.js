(() => {
  'use strict';

  const PHONE_RAW = '+33625170665';
  const STORAGE_KEY = 'hf_intervention_v2';
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
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => revealObs.observe(el));
  }

  // ─── 2. TABLEAU ÉLECTRIQUE INTERACTIF ───
  const CIRCUITS = {
    depannage: {
      title: 'C1 — Dépannage & recherche de panne',
      ref: 'Intervention rapide',
      desc: "Disjoncteur qui saute, coupure partielle, prise qui chauffe ou tableau qui grésille : recherche précise du défaut et remise en sécurité propre.",
      cta: 'Signaler une panne sur ce circuit',
      mode: 'URGENCE',
      status: 'Circuit C1 actif'
    },
    installation: {
      title: 'C2 — Installation & appareillage',
      ref: 'Neuf & remplacement',
      desc: "Pose de tableaux électriques, prises dédiées, interrupteurs et éclairages intérieurs ou extérieurs, dimensionnés pour vos usages réels.",
      cta: 'Demander un devis installation',
      mode: 'DEVIS',
      status: 'Circuit C2 actif'
    },
    normes: {
      title: 'C3 — Mise aux normes NF C 15-100',
      ref: 'Consuel, vente & location',
      desc: "Protection différentielle 30 mA, mise à la terre, repérage complet et levée des anomalies relevées sur votre diagnostic électrique.",
      cta: 'Planifier une mise aux normes',
      mode: 'NORMES',
      status: 'Circuit C3 actif'
    },
    renovation: {
      title: 'C4 — Rénovation électrique complète',
      ref: 'Maison, gîte & local pro',
      desc: "Réfection totale d'une installation ancienne en Béarn : cheminement propre, tableau neuf étiqueté et conformité durable.",
      cta: 'Parler de votre rénovation',
      mode: 'DEVIS',
      status: 'Circuit C4 actif'
    }
  };

  const breakerBtns = document.querySelectorAll('.breaker[data-circuit]');
  const readoutTitle = document.getElementById('readout-title');
  const readoutRef = document.getElementById('readout-ref');
  const readoutDesc = document.getElementById('readout-desc');
  const readoutCta = document.getElementById('readout-cta');
  const panelStatus = document.getElementById('panel-status');

  function selectCircuit(key) {
    const data = CIRCUITS[key];
    if (!data) return;
    breakerBtns.forEach((btn) => {
      const active = btn.dataset.circuit === key;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (readoutTitle) readoutTitle.textContent = data.title;
    if (readoutRef) readoutRef.textContent = data.ref;
    if (readoutDesc) readoutDesc.textContent = data.desc;
    if (readoutCta) {
      readoutCta.textContent = data.cta;
      readoutCta.dataset.preset = data.mode;
    }
    if (panelStatus) panelStatus.textContent = data.status;
  }

  breakerBtns.forEach((btn) => {
    btn.addEventListener('click', () => selectCircuit(btn.dataset.circuit));
  });

  if (readoutCta) {
    readoutCta.addEventListener('click', () => {
      const targetMode = readoutCta.dataset.preset;
      if (!targetMode) return;
      const radio = document.querySelector(`input[name="mode"][value="${targetMode}"]`);
      if (radio) {
        radio.checked = true;
        updatePreview();
        saveState();
      }
    });
  }

  // ─── 3. CARTE VECTORIELLE DU PIÉMONT BÉARNAIS ───
  const CITIES = {
    lanne: { label: 'Lanne-en-Barétous — Atelier de départ', meta: 'Base 64570', x: 170, y: 235 },
    arette: { label: 'Arette — Vallée de Barétous', meta: 'Environ 5 min', x: 195, y: 262 },
    oloron: { label: 'Oloron-Sainte-Marie — Piémont oloronais', meta: 'Environ 18 min', x: 245, y: 200 },
    mauleon: { label: 'Mauléon-Licharre — Soule', meta: 'Environ 22 min', x: 88, y: 196 },
    navarrenx: { label: 'Navarrenx — Béarn des Gaves', meta: 'Environ 25 min', x: 152, y: 132 },
    pierre: { label: 'La Pierre Saint-Martin — Station & chalets', meta: 'Environ 30 min', x: 178, y: 322 },
    arudy: { label: 'Arudy — Vallée d’Ossau', meta: 'Environ 32 min', x: 312, y: 238 },
    mourenx: { label: 'Mourenx — Bassin de Lacq', meta: 'Environ 38 min', x: 248, y: 96 },
    orthez: { label: 'Orthez — Secteur Nord Béarn', meta: 'Environ 42 min', x: 188, y: 54 },
    pau: { label: 'Pau — Agglomération paloise', meta: 'Environ 48 min', x: 376, y: 138 }
  };

  const communeBtns = document.querySelectorAll('.commune-btn[data-city]');
  const mapNodes = document.querySelectorAll('.map-node[data-node]');
  const mapActiveLine = document.getElementById('map-active-line');
  const mapActiveLabel = document.getElementById('map-active-label');
  const mapActiveMeta = document.getElementById('map-active-meta');

  function selectCity(key) {
    const city = CITIES[key];
    if (!city) return;

    communeBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.city === key);
    });
    mapNodes.forEach((node) => {
      node.classList.toggle('is-active', node.dataset.node === key);
    });

    if (mapActiveLine) {
      mapActiveLine.setAttribute('x2', String(city.x));
      mapActiveLine.setAttribute('y2', String(city.y));
    }
    if (mapActiveLabel) mapActiveLabel.textContent = city.label;
    if (mapActiveMeta) mapActiveMeta.textContent = city.meta;
  }

  communeBtns.forEach((btn) => {
    btn.addEventListener('click', () => selectCity(btn.dataset.city));
  });

  mapNodes.forEach((node) => {
    node.addEventListener('click', () => selectCity(node.dataset.node));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCity(node.dataset.node);
      }
    });
  });

  // ─── 4. PARCOURS TERRAIN : DEMANDE D'INTERVENTION ───
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
      btnSms.textContent = 'Envoyer par SMS à Fabien';
    } else {
      deviceHint.textContent = "Sur ordinateur : copiez la demande ou appelez directement le 06 25 17 06 65 (les liens SMS ne s'ouvrent pas sur tous les PC).";
      btnSms.textContent = 'Ouvrir SMS (si configuré)';
    }
  }

  function toAsciiGsm(str) {
    return str
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

    if (note) {
      lines.push(`Detail : ${note}`);
    }
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
    if (focusEl && typeof focusEl.focus === 'function') {
      focusEl.focus();
    }
  }

  function validateForm() {
    clearError();
    if (!nameInput.value.trim()) {
      showError('Merci d’indiquer votre prénom et nom afin que Fabien sache qui rappeler.', nameInput);
      return false;
    }
    if (!phoneInput.value.trim() || phoneInput.value.replace(/\D/g, '').length < 10) {
      showError('Merci d’indiquer un numéro de téléphone valide (10 chiffres) pour le rappel.', phoneInput);
      return false;
    }
    if (!citySelect.value) {
      showError('Merci de choisir la commune d’intervention dans la liste.', citySelect);
      return false;
    }
    if (slotSelect.value === 'Creneau precis' && !slotDetailInput.value.trim()) {
      showError('Merci de préciser la date ou le créneau souhaité.', slotDetailInput);
      return false;
    }
    if (!addressInput.value.trim()) {
      showError('Merci d’indiquer la rue et le numéro pour préparer l’intervention.', addressInput);
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
      const payload = {
        mode: getSelectedMode(),
        name: nameInput.value,
        phone: phoneInput.value,
        city: citySelect.value,
        slot: slotSelect.value,
        slotDetail: slotDetailInput.value,
        address: addressInput.value,
        access: accessInput.value,
        note: noteInput.value
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_e) {
      // sessionStorage indisponible en navigation privée stricte
    }
  }

  function restoreState() {
    if (!form) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.mode) {
        const radio = form.querySelector(`input[name="mode"][value="${data.mode}"]`);
        if (radio) radio.checked = true;
      }
      if (typeof data.name === 'string') nameInput.value = data.name;
      if (typeof data.phone === 'string') phoneInput.value = data.phone;
      if (typeof data.city === 'string') citySelect.value = data.city;
      if (typeof data.slot === 'string') slotSelect.value = data.slot;
      if (typeof data.slotDetail === 'string') slotDetailInput.value = data.slotDetail;
      if (typeof data.address === 'string') addressInput.value = data.address;
      if (typeof data.access === 'string') accessInput.value = data.access;
      if (typeof data.note === 'string') noteInput.value = data.note;
    } catch (_e) {
      // Ignore un état corrompu
    }
  }

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
            showFeedback(
              'Demande copiée. Envoyez-la par SMS au 06 25 17 06 65 ou par email. Confirmation après rappel de Fabien.'
            );
          } else {
            showFeedback('Copie manuelle : sélectionnez le texte dans l’aperçu ci-dessus et envoyez-le au 06 25 17 06 65.');
          }
        } catch (_e) {
          showFeedback('Copie manuelle : sélectionnez le texte dans l’aperçu ci-dessus et envoyez-le au 06 25 17 06 65.');
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

  // ─── 5. RETOUR EN HAUT ───
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

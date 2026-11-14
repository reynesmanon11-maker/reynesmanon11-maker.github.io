/* ==========================================================================
   Diaporama interactif — moteur
   Un seul fichier, sans bibliothèque. Lit le HTML de la page (attributs data-*)
   et lui donne vie : mise à l'échelle, navigation, fenêtres, infobulles,
   animations, quiz, digicode, cadenas, cartes, minuteur, glisser-déposer.
   Le vocabulaire est décrit dans references/briques.md.
   ========================================================================== */
(function () {
  'use strict';

  var L = 1200, H = 675;
  var VITESSES = { '1': 0.5, '2': 1, '3': 2, '4': 3 };
  var FONDS = ['foret', 'ocean', 'nuit', 'volcan', 'parchemin', 'labo', 'metal', 'prairie', 'degrade'];
  var ACTIONS = '[data-aller],[data-ouvrir],[data-fermer],[data-lien],[data-montrer],[data-cacher],[data-basculer]';
  var ICONES = {
    'fleche-droite': 'M5 12h14M13 6l6 6-6 6',
    'fleche-gauche': 'M19 12H5M11 6l-6 6 6 6',
    'plus': 'M12 5v14M5 12h14',
    'croix': 'M6 6l12 12M18 6L6 18',
    'coche': 'M5 12.5l4.5 4.5L19 7.5',
    'cadenas': 'M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z',
    'oeil': 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
    'maison': 'M4 11l8-7 8 7M6 10v10h12V10',
    'lecture': 'M8 5l11 7-11 7z',
    'pause': 'M8 5v14M16 5v14',
    'info': 'M12 11v6M12 7.5v.5M12 3a9 9 0 100 18 9 9 0 000-18z',
    'loupe': 'M11 4a7 7 0 100 14 7 7 0 000-14zM16.5 16.5L21 21',
    'main': 'M9 12V5.5a1.5 1.5 0 013 0V11m0-1.5a1.5 1.5 0 013 0V11m0-.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-.8a6 6 0 01-5-2.6L5 15a1.6 1.6 0 012.5-2L9 14.5',
    'plein-ecran': 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
    'etoile': 'M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z',
    'horloge': 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
    'retour': 'M9 6l-5 5 5 5M4 11h10a5 5 0 010 10h-3',
    'lien': 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
    'effacer': 'M9 6h11v12H9l-6-6zM13 10l4 4M17 10l-4 4',
    'recommencer': 'M4 12a8 8 0 108-8H7M10 1L7 4l3 3'
  };

  var diapo, pages = [], fenetres = [], permanents = [];
  var courante = -1, pile = [], echelle = 1, fenetreOuverte = null;
  var rideau, infobulle, outils = {}, deverrouillees = {}, jeton = 0, audio = null;

  /* ---------- Petits outils ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function cree(balise, classe, html) {
    var e = document.createElement(balise);
    if (classe) e.className = classe;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function ico(nom) { return '<i class="ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICONES[nom] || '') + '"/></svg></i>'; }
  function melange(t) {
    for (var i = t.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = t[i]; t[i] = t[j]; t[j] = x; }
    return t;
  }
  function secoue(el) {
    el.classList.remove('dp-secoue'); void el.offsetWidth; el.classList.add('dp-secoue');
    setTimeout(function () { el.classList.remove('dp-secoue'); }, 520);
  }

  /* Réponses : comparées sans accent, sans casse, sans espaces superflus.
     L'assembleur remplace la réponse en clair par une empreinte (data-…-h). */
  function normalise(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function empreinte(s) {
    var o = new TextEncoder().encode('dp1:' + s), h = 0x811c9dc5;
    for (var i = 0; i < o.length; i++) { h ^= o[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function correspond(saisie, el, nom) {
    var n = normalise(saisie), h = el.getAttribute('data-' + nom + '-h');
    if (h) return h.split(' ').indexOf(empreinte(n)) >= 0;
    return (el.getAttribute('data-' + nom) || '').split('|').map(normalise).indexOf(n) >= 0;
  }

  /* Deux petits sons de synthèse (seulement si la diapo porte data-sons) */
  function son(type) {
    if (!diapo.hasAttribute('data-sons')) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var notes = type === 'ok' ? [660, 880] : [196, 147];
      notes.forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * 0.13;
        o.type = type === 'ok' ? 'sine' : 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.24);
      });
    } catch (e) { /* pas de son : tant pis */ }
  }

  /* ---------- Mise à l'échelle ---------- */
  function ajuste() {
    var w = window.innerWidth, h = window.innerHeight;
    echelle = Math.min(w / L, h / H);
    var x = (w - L * echelle) / 2, y = (h - H * echelle) / 2;
    diapo.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + echelle + ')';
    if (outils.boite) {
      outils.boite.style.left = x + 'px'; outils.boite.style.top = y + 'px';
      outils.boite.style.width = L * echelle + 'px'; outils.boite.style.height = H * echelle + 'px';
    }
  }

  /* ---------- Préparation du HTML ---------- */
  function prepare() {
    $$('[data-pos]', diapo).forEach(function (el) {
      var v = el.getAttribute('data-pos').split(','), noms = ['left', 'top', 'width', 'height'];
      v.forEach(function (x, i) { x = x.trim(); if (x && x !== '-' && noms[i]) el.style[noms[i]] = /[a-z%]/.test(x) ? x : x + 'px'; });
      el.classList.add('el');
    });
    $$('[data-rot]', diapo).forEach(function (el) { el.style.rotate = el.getAttribute('data-rot') + 'deg'; });
    $$('[data-teinte]', diapo).forEach(function (el) { el.style.setProperty('--teinte', el.getAttribute('data-teinte')); });
    $$('[data-ico]', diapo).forEach(function (el) { el.classList.add('ico'); el.innerHTML = ico(el.getAttribute('data-ico')).replace(/^<i class="ico">|<\/i>$/g, ''); });

    pages.forEach(function (p) {
      var f = p.getAttribute('data-fond');
      if (f) {
        if (FONDS.indexOf(f) >= 0) p.classList.add('fond-' + f);
        else if (/^(#|rgb|hsl)/.test(f)) p.style.backgroundColor = f;
        else if (/gradient\(/.test(f)) p.style.backgroundImage = f;
        else p.style.backgroundImage = 'url("' + f + '")';
      }
      if (p.getAttribute('data-cadrage')) p.style.backgroundPosition = p.getAttribute('data-cadrage');
      var v = parseFloat(p.getAttribute('data-voile'));
      if (v) { var voile = cree('div', 'voile'); voile.style.opacity = v; p.insertBefore(voile, p.firstChild); }
    });

    /* Cascade : les enfants d'un bloc entrent l'un après l'autre */
    $$('[data-cascade]', diapo).forEach(function (c) {
      var pas = parseFloat(c.getAttribute('data-cascade')) || 0.15, base = parseFloat(c.getAttribute('data-delai')) || 0;
      var anim = c.getAttribute('data-cascade-anim') || 'fondu-bas';
      Array.prototype.forEach.call(c.children, function (e, i) {
        if (!e.hasAttribute('data-anim')) e.setAttribute('data-anim', anim);
        if (!e.hasAttribute('data-delai')) e.setAttribute('data-delai', (base + i * pas).toFixed(2));
        if (!e.hasAttribute('data-vitesse') && c.hasAttribute('data-vitesse')) e.setAttribute('data-vitesse', c.getAttribute('data-vitesse'));
      });
    });
    $$('[data-anim]', diapo).forEach(function (el) {
      var v = el.getAttribute('data-vitesse'), d = el.getAttribute('data-delai');
      if (v) el.style.setProperty('--dur', (VITESSES[v] || parseFloat(v) || 1) + 's');
      if (d) el.style.setProperty('--del', (parseFloat(d) || 0) + 's');
    });

    /* Éclats : étoile irrégulière */
    $$('.eclat', diapo).forEach(function (el) {
      var n = parseInt(el.getAttribute('data-pointes'), 10) || 14, pts = [];
      for (var i = 0; i < n * 2; i++) {
        var a = Math.PI * i / n - Math.PI / 2, r = i % 2 ? 33 + (i * 7 % 5) : 46 + (i * 5 % 4);
        pts.push((50 + r * Math.cos(a)).toFixed(1) + '% ' + (50 + r * Math.sin(a)).toFixed(1) + '%');
      }
      el.style.clipPath = 'polygon(' + pts.join(',') + ')';
    });

    /* Éléments cliquables : curseur, clavier, lecteurs d'écran */
    $$(ACTIONS + ',[data-info],.carte', diapo).forEach(function (el) {
      el.classList.add('dp-actif');
      if (!/^(BUTTON|A|INPUT)$/.test(el.tagName)) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        if (el.matches(ACTIONS + ',.carte')) el.setAttribute('role', 'button');
      }
    });
  }

  /* ---------- Navigation ---------- */
  function indexDe(id) {
    id = String(id).replace(/^#/, '');
    for (var i = 0; i < pages.length; i++) if (pages[i].id === id) return i;
    return -1;
  }
  function resous(mot) {
    switch (mot) {
      case 'suivante': return Math.min(courante + 1, pages.length - 1);
      case 'precedente': return Math.max(courante - 1, 0);
      case 'debut': return 0;
      case 'fin': return pages.length - 1;
      case 'retour': return pile.length ? pile[pile.length - 1] : Math.max(courante - 1, 0);
    }
    return indexDe(mot);
  }
  function nettoie(p) {
    p.className = p.className.split(/\s+/).filter(function (c) { return !/^(quitte|arrive|arriere|t-.*)$/.test(c); }).join(' ');
  }
  function aller(cible) {
    var retour = cible === 'retour';
    var i = typeof cible === 'number' ? cible : resous(cible);
    fermer();
    if (i < 0 || i >= pages.length || i === courante) return;
    var avant = pages[courante], apres = pages[i], arriere = i < courante;
    var t = apres.getAttribute('data-transition') || diapo.getAttribute('data-transition') || 'fondu';
    var mon = ++jeton;
    pages.forEach(nettoie);
    if (avant) {
      quitte(avant);
      avant.classList.remove('active');
      if (t !== 'aucune') { avant.classList.add('quitte', 't-' + t); if (arriere) avant.classList.add('arriere'); }
      if (retour) pile.pop(); else pile.push(courante);
    }
    apres.classList.add('active');
    if (avant && t !== 'aucune') { apres.classList.add('arrive', 't-' + t); if (arriere) apres.classList.add('arriere'); }
    setTimeout(function () { if (mon === jeton) pages.forEach(nettoie); }, 700);
    courante = i;
    entre(apres);
    try { history.replaceState(null, '', '#' + apres.id); } catch (e) { /* cadre isolé : sans importance */ }
  }
  function entre(bloc) {
    $$('.dp-fini', bloc).forEach(function (e) { e.classList.remove('dp-fini'); });
    $$('.integration[data-src]', bloc).forEach(function (b) {
      if ($('iframe', b)) return;
      var f = cree('iframe');
      f.src = b.getAttribute('data-src'); f.title = b.getAttribute('data-titre') || 'Contenu intégré';
      f.setAttribute('allowfullscreen', ''); f.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');
      b.dataset.attente = b.innerHTML; b.innerHTML = ''; b.appendChild(f);
    });
    if (bloc.classList.contains('page')) {
      var verrou = $(':scope > .verrou', bloc);
      if (verrou) verrou.classList.toggle('cache', !!deverrouillees[bloc.id]);
      majPermanents(bloc); majOutils();
      document.dispatchEvent(new CustomEvent('diapo:page', { detail: { id: bloc.id } }));
    }
  }
  function quitte(bloc) {
    cacheInfo();
    $$('.integration[data-src]', bloc).forEach(function (b) {
      if ($('iframe', b)) b.innerHTML = b.dataset.attente || '';
    });
  }
  function majPermanents(page) {
    var noms = [page.id, page.getAttribute('data-rubrique') || ''];
    function dans(liste) { return liste.split(/\s+/).some(function (n) { return n && noms.indexOf(n.replace(/^#/, '')) >= 0; }); }
    permanents.forEach(function (el) {
      var sur = el.getAttribute('data-sur'), sauf = el.getAttribute('data-sauf');
      el.classList.toggle('cache', (sur != null && !dans(sur)) || (sauf != null && dans(sauf)));
    });
    $$('.barre > [data-aller]', diapo).forEach(function (a) {
      var c = a.getAttribute('data-aller').replace(/^#/, '');
      a.classList.toggle('ici', noms.indexOf(c) >= 0);
    });
  }

  /* ---------- Fenêtres ---------- */
  function ouvrir(id) {
    var f = typeof id === 'string' ? document.getElementById(id.replace(/^#/, '')) : id;
    if (!f || !f.classList.contains('fenetre')) return;
    fermer();
    rideau.classList.add('active'); f.classList.add('active'); fenetreOuverte = f;
    entre(f);
    var x = $('.fermer', f); if (x) x.focus({ preventScroll: true });
  }
  function fermer() {
    if (!fenetreOuverte) return;
    quitte(fenetreOuverte);
    fenetreOuverte.classList.remove('active'); rideau.classList.remove('active'); fenetreOuverte = null;
  }

  /* ---------- Actions ---------- */
  function elements(liste) {
    return liste.trim().split(/\s+/).map(function (n) { return document.getElementById(n.replace(/^#/, '')); }).filter(Boolean);
  }
  /* Une « cible » : mot-clé de navigation, page, fenêtre, ou élément caché à révéler */
  function declenche(liste) {
    if (!liste) return;
    liste.trim().split(/\s+/).forEach(function (mot) {
      if (/^(suivante|precedente|debut|fin|retour)$/.test(mot)) return aller(mot);
      var el = document.getElementById(mot.replace(/^#/, ''));
      if (!el) return;
      if (el.classList.contains('page')) aller(el.id);
      else if (el.classList.contains('fenetre')) ouvrir(el);
      else el.classList.remove('cache');
    });
  }
  function agit(el) {
    var v;
    if ((v = el.getAttribute('data-montrer'))) elements(v).forEach(function (e) { e.classList.remove('cache'); });
    if ((v = el.getAttribute('data-cacher'))) elements(v).forEach(function (e) { e.classList.add('cache'); });
    if ((v = el.getAttribute('data-basculer'))) elements(v).forEach(function (e) { e.classList.toggle('cache'); });
    if (el.hasAttribute('data-fermer')) fermer();
    if ((v = el.getAttribute('data-ouvrir'))) ouvrir(v);
    if ((v = el.getAttribute('data-aller'))) aller(v);
    if ((v = el.getAttribute('data-lien'))) window.open(v, '_blank', 'noopener');
  }

  /* ---------- Infobulles ---------- */
  function montreInfo(el) {
    infobulle.textContent = el.getAttribute('data-info');
    infobulle.classList.add('visible');
    var r = el.getBoundingClientRect(), d = diapo.getBoundingClientRect();
    var x = (r.left + r.width / 2 - d.left) / echelle, haut = (r.top - d.top) / echelle, bas = (r.bottom - d.top) / echelle;
    var w = infobulle.offsetWidth, h = infobulle.offsetHeight;
    var y = haut - h - 12; if (y < 8) y = Math.min(bas + 12, H - h - 8);
    infobulle.style.left = Math.max(8, Math.min(L - w - 8, x - w / 2)) + 'px';
    infobulle.style.top = y + 'px';
  }
  function cacheInfo() { if (infobulle) infobulle.classList.remove('visible'); }

  /* ---------- Composants ---------- */
  function initFenetres() {
    rideau = cree('div', 'rideau'); diapo.appendChild(rideau);
    rideau.addEventListener('click', fermer);
    fenetres.forEach(function (f) {
      if (f.hasAttribute('data-sans-croix')) return;
      var x = cree('button', 'fermer', ico('croix')); x.setAttribute('aria-label', 'Fermer'); x.setAttribute('data-fermer', '');
      f.appendChild(x);
    });
  }

  function initQuiz() {
    $$('.quiz', diapo).forEach(function (q) {
      var choix = $$('.choix', q), multiple = q.hasAttribute('data-multiple');
      if (!choix.length) return;
      if (q.hasAttribute('data-melange')) {
        var suite = choix[choix.length - 1].nextSibling, parent = choix[0].parentNode;
        melange(choix).forEach(function (c) { parent.insertBefore(c, suite); });
      }
      var retour = $('.retour', q);
      if (!retour) { retour = cree('p', 'retour'); choix[0].parentNode.insertBefore(retour, choix[choix.length - 1].nextSibling); }
      retour.setAttribute('aria-live', 'polite');
      function reussi() {
        q.classList.add('fini'); retour.className = 'retour ok';
        retour.textContent = q.getAttribute('data-bravo') || 'Bravo, c’est juste !';
        choix.forEach(function (c) { if (c.hasAttribute('data-juste')) c.classList.add('juste'); });
        son('ok');
        var r = q.getAttribute('data-reussite');
        if (r) setTimeout(function () { declenche(r); }, 900);
      }
      function rate(fautifs) {
        fautifs.forEach(function (c) { c.classList.add('faux'); secoue(c); });
        retour.className = 'retour ko';
        retour.textContent = q.getAttribute('data-rate') || 'Pas tout à fait… essaie encore.';
        son('ko'); declenche(q.getAttribute('data-echec'));
      }
      choix.forEach(function (c) {
        c.addEventListener('click', function () {
          if (q.classList.contains('fini')) return;
          choix.forEach(function (x) { x.classList.remove('faux'); });
          if (multiple) { c.classList.toggle('choisi'); return; }
          if (c.hasAttribute('data-juste')) reussi(); else rate([c]);
        });
      });
      if (multiple) {
        var b = cree('button', 'bouton valider', 'Valider');
        retour.parentNode.insertBefore(b, retour);
        b.addEventListener('click', function () {
          if (q.classList.contains('fini')) return;
          var erreurs = choix.filter(function (c) { return c.classList.contains('choisi') !== c.hasAttribute('data-juste'); });
          if (erreurs.length) rate(erreurs.filter(function (c) { return c.classList.contains('choisi'); }));
          else { b.classList.add('cache'); reussi(); }
        });
      }
    });
  }

  function initDigicodes() {
    $$('.digicode', diapo).forEach(function (d) {
      var n = parseInt(d.getAttribute('data-n'), 10) || (d.getAttribute('data-code') || '').split('|')[0].length || 4;
      var saisie = '', bloque = false;
      d.innerHTML = '<div class="ecran" aria-live="polite"></div><div class="touches"></div>';
      var ecran = $('.ecran', d), touches = $('.touches', d);
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', '0', 'r'].forEach(function (t) {
        var b = cree('button', '', t === 'x' ? ico('effacer') : t === 'r' ? ico('recommencer') : t);
        b.setAttribute('aria-label', t === 'x' ? 'Effacer' : t === 'r' ? 'Tout effacer' : t);
        b.addEventListener('click', function () { frappe(t); });
        touches.appendChild(b);
      });
      function affiche() { ecran.textContent = saisie + new Array(n - saisie.length + 1).join('·'); }
      function frappe(t) {
        if (bloque || d.classList.contains('ouvert')) return;
        if (t === 'x') saisie = saisie.slice(0, -1);
        else if (t === 'r') saisie = '';
        else if (saisie.length < n) saisie += t;
        affiche();
        if (saisie.length === n) {
          bloque = true;
          setTimeout(function () {
            if (correspond(saisie, d, 'code')) {
              d.classList.add('ouvert'); ecran.textContent = 'OUVERT'; son('ok');
              var r = d.getAttribute('data-reussite');
              if (r) setTimeout(function () { declenche(r); }, 700);
            } else {
              ecran.classList.add('erreur'); ecran.textContent = 'ERREUR'; secoue(d); son('ko');
              declenche(d.getAttribute('data-echec'));
              setTimeout(function () { ecran.classList.remove('erreur'); saisie = ''; bloque = false; affiche(); }, 1000);
            }
          }, 250);
        }
      }
      d.dpFrappe = frappe;
      affiche();
    });
  }

  function champReponse(hote, nom, invite, type) {
    var ligne = cree('div', 'saisie');
    var champ = cree('input'); champ.type = type || 'text'; champ.placeholder = invite;
    champ.setAttribute('autocomplete', 'off'); champ.setAttribute('autocapitalize', 'off'); champ.setAttribute('spellcheck', 'false');
    champ.setAttribute('aria-label', invite);
    var bouton = cree('button', 'valider', ico('coche')); bouton.setAttribute('aria-label', 'Valider');
    ligne.appendChild(champ); ligne.appendChild(bouton); hote.appendChild(ligne);
    return { champ: champ, bouton: bouton, ligne: ligne };
  }

  function initCadenas() {
    $$('.cadenas', diapo).forEach(function (c) {
      var consigne = cree('div', 'consigne', c.innerHTML), essais = 0;
      c.innerHTML = ''; if (consigne.textContent.trim()) c.appendChild(consigne);
      var s = champReponse(c, 'reponse', c.getAttribute('data-invite') || 'Ta réponse');
      var retour = cree('p', 'retour'); retour.setAttribute('aria-live', 'polite'); c.appendChild(retour);
      function valide() {
        if (c.classList.contains('ouvert') || !s.champ.value.trim()) return;
        if (correspond(s.champ.value, c, 'reponse')) {
          c.classList.add('ouvert'); s.champ.disabled = true; retour.className = 'retour';
          retour.textContent = c.getAttribute('data-bravo') || 'Déverrouillé !'; son('ok');
          var r = c.getAttribute('data-reussite');
          if (r) setTimeout(function () { declenche(r); }, 700);
        } else {
          essais++; secoue(s.ligne); son('ko'); retour.className = 'retour ko';
          var indice = c.getAttribute('data-indice');
          retour.textContent = (indice && essais >= 2) ? 'Indice : ' + indice : (c.getAttribute('data-rate') || 'Ce n’est pas ça… cherche encore.');
          declenche(c.getAttribute('data-echec'));
        }
      }
      s.bouton.addEventListener('click', valide);
      s.champ.addEventListener('keydown', function (e) { if (e.key === 'Enter') valide(); });
    });
  }

  function initVerrous() {
    pages.forEach(function (p) {
      if (!p.hasAttribute('data-verrou') && !p.hasAttribute('data-verrou-h')) return;
      var v = cree('div', 'verrou'), boite = cree('div', 'boite');
      boite.innerHTML = '<div class="rond-cadenas">' + ico('cadenas') + '</div><h2>' + (p.getAttribute('data-verrou-titre') || 'Cette page est protégée par mot de passe') + '</h2>';
      var s = champReponse(boite, 'verrou', 'Mot de passe', 'password');
      v.appendChild(boite); p.appendChild(v);
      function valide() {
        if (correspond(s.champ.value, p, 'verrou')) { deverrouillees[p.id] = true; v.classList.add('cache'); son('ok'); }
        else { secoue(boite); son('ko'); s.champ.select(); }
      }
      s.bouton.addEventListener('click', valide);
      s.champ.addEventListener('keydown', function (e) { if (e.key === 'Enter') valide(); });
    });
  }

  function initCartes() {
    $$('.carte', diapo).forEach(function (c) {
      c.addEventListener('click', function (e) {
        if (e.target.closest(ACTIONS)) return;
        c.classList.toggle('retournee');
      });
    });
  }

  function initMinuteurs() {
    $$('.minuteur', diapo).forEach(function (m) {
      var txt = (m.getAttribute('data-duree') || '5:00').split(':');
      var total = txt.length > 1 ? parseInt(txt[0], 10) * 60 + parseInt(txt[1], 10) : parseInt(txt[0], 10);
      var reste = total, fin = 0, horloge = null, sonne = false;
      m.innerHTML = ico('horloge') + '<span class="temps"></span><button class="jouer" aria-label="Lancer ou mettre en pause"></button><button class="zero" aria-label="Remettre à zéro">' + ico('recommencer') + '</button>';
      var temps = $('.temps', m), jouer = $('.jouer', m);
      function affiche() {
        var s = Math.max(0, Math.ceil(reste));
        temps.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
        jouer.innerHTML = ico(horloge ? 'pause' : 'lecture');
        m.classList.toggle('presque', s > 0 && s <= total * 0.2);
        m.classList.toggle('termine', s === 0);
      }
      function tic() {
        reste = (fin - Date.now()) / 1000;
        if (reste <= 0) {
          reste = 0; clearInterval(horloge); horloge = null;
          if (!sonne) { sonne = true; son('ko'); declenche(m.getAttribute('data-fin')); }
        }
        affiche();
      }
      function lance() { if (horloge || reste <= 0) return; fin = Date.now() + reste * 1000; horloge = setInterval(tic, 250); affiche(); }
      function pause() { if (!horloge) return; clearInterval(horloge); horloge = null; affiche(); }
      jouer.addEventListener('click', function () { if (horloge) pause(); else lance(); });
      $('.zero', m).addEventListener('click', function () { pause(); reste = total; sonne = false; affiche(); });
      if (m.hasAttribute('data-auto')) {
        var quand = m.getAttribute('data-auto').replace(/^#/, ''), page = m.closest('.page');
        document.addEventListener('diapo:page', function (e) {
          if ((quand && e.detail.id === quand) || (!quand && (!page || page.id === e.detail.id))) lance();
        });
      }
      affiche();
    });
  }

  function initGlisser() {
    $$('.glisser', diapo).forEach(function (g) {
      var jetons = $$('.jeton', g), depots = $$('.depot', g), reserve = $('.reserve', g);
      if (!reserve) { reserve = cree('div', 'reserve'); g.insertBefore(reserve, g.firstChild); jetons.forEach(function (j) { reserve.appendChild(j); }); }
      if (g.hasAttribute('data-melange')) melange(jetons.slice()).forEach(function (j) { reserve.appendChild(j); });
      var retour = $('.retour', g), bouton = $('.verifier', g);
      if (!bouton) { bouton = cree('button', 'bouton petit verifier', 'Vérifier'); g.appendChild(bouton); }
      if (!retour) { retour = cree('p', 'retour'); g.appendChild(retour); }
      retour.setAttribute('aria-live', 'polite');
      function sous(x, y) {
        for (var i = 0; i < depots.length; i++) {
          var r = depots[i].getBoundingClientRect();
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return depots[i];
        }
        return null;
      }
      function efface() { depots.forEach(function (d) { d.classList.remove('juste', 'faux', 'survole'); }); retour.textContent = ''; retour.className = 'retour'; }
      g.addEventListener('pointerdown', function (e) {
        var j = e.target.closest('.jeton');
        if (!j || g.classList.contains('fini')) return;
        e.preventDefault(); efface();
        var x0 = e.clientX, y0 = e.clientY;
        j.classList.add('saisi'); g.style.zIndex = 30;
        try { j.setPointerCapture(e.pointerId); } catch (err) { /* sans capture : on suit quand même */ }
        function bouge(ev) {
          j.style.transform = 'translate(' + (ev.clientX - x0) / echelle + 'px,' + (ev.clientY - y0) / echelle + 'px)';
          var d = sous(ev.clientX, ev.clientY);
          depots.forEach(function (z) { z.classList.toggle('survole', z === d); });
        }
        function lache(ev) {
          j.removeEventListener('pointermove', bouge); j.removeEventListener('pointerup', lache); j.removeEventListener('pointercancel', lache);
          j.classList.remove('saisi'); j.style.transform = ''; g.style.zIndex = '';
          var d = ev.type === 'pointerup' ? sous(ev.clientX, ev.clientY) : null;
          depots.forEach(function (z) { z.classList.remove('survole'); });
          if (d) {
            var deja = $('.jeton', d);
            if (deja && deja !== j && !d.hasAttribute('data-plusieurs')) reserve.appendChild(deja);
            d.appendChild(j);
          } else reserve.appendChild(j);
        }
        j.addEventListener('pointermove', bouge); j.addEventListener('pointerup', lache); j.addEventListener('pointercancel', lache);
      });
      bouton.addEventListener('click', function () {
        if (g.classList.contains('fini')) return;
        var tout = true;
        depots.forEach(function (d) {
          var attend = (d.getAttribute('data-attend') || '').split(/\s+/), dedans = $$('.jeton', d);
          var ok = dedans.length > 0 && dedans.every(function (j) { return attend.indexOf(j.getAttribute('data-va')) >= 0; });
          d.classList.toggle('juste', ok); d.classList.toggle('faux', !ok);
          if (!ok) tout = false;
        });
        if ($$('.jeton[data-va]', reserve).some(function (j) { return j.getAttribute('data-va'); })) tout = false;
        if (tout) {
          g.classList.add('fini'); retour.className = 'retour ok'; retour.textContent = g.getAttribute('data-bravo') || 'Bravo, tout est bien placé !';
          bouton.classList.add('cache'); son('ok');
          var r = g.getAttribute('data-reussite');
          if (r) setTimeout(function () { declenche(r); }, 900);
        } else {
          retour.className = 'retour ko'; retour.textContent = g.getAttribute('data-rate') || 'Il reste des erreurs : déplace les étiquettes en rouge.';
          son('ko'); declenche(g.getAttribute('data-echec'));
        }
      });
    });
  }

  /* ---------- Outils du lecteur ---------- */
  function initOutils() {
    var b = cree('div', 'dp-outils'); document.body.appendChild(b); outils.boite = b;
    function bouton(classe, icone, titre, action) {
      var x = cree('button', classe, ico(icone)); x.title = titre; x.setAttribute('aria-label', titre);
      x.addEventListener('click', action); b.appendChild(x); return x;
    }
    if (diapo.getAttribute('data-reperes') !== 'non') {
      outils.main = bouton('o-main', 'main', 'Montrer les éléments interactifs', function () {
        diapo.classList.remove('montre-actifs'); void diapo.offsetWidth; diapo.classList.add('montre-actifs');
        setTimeout(function () { diapo.classList.remove('montre-actifs'); }, 3100);
      });
    }
    if (document.fullscreenEnabled) {
      outils.plein = bouton('o-plein', 'plein-ecran', 'Plein écran', function () {
        if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
      });
    }
    outils.prec = bouton('o-prec', 'fleche-gauche', 'Page précédente', function () { aller('precedente'); });
    outils.suiv = bouton('o-suiv', 'fleche-droite', 'Page suivante', function () { aller('suivante'); });
    outils.compte = cree('div', 'o-compte'); b.appendChild(outils.compte);
  }
  function navLibre() {
    var p = pages[courante];
    return ((p && p.getAttribute('data-nav')) || diapo.getAttribute('data-nav') || 'fleches') !== 'fleches';
  }
  function majOutils() {
    if (!outils.boite) return;
    var libre = navLibre();
    outils.prec.hidden = libre || courante <= 0;
    outils.suiv.hidden = libre || courante >= pages.length - 1;
    outils.compte.hidden = !diapo.hasAttribute('data-compteur');
    outils.compte.textContent = (courante + 1) + ' / ' + pages.length;
  }

  /* ---------- Contrôle de mise en page (Diapo.controle(), ou ?controle dans l'adresse) ---------- */
  function decrit(el) {
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36);
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + el.classList[0] : '') + (t ? ' « ' + t + ' »' : '');
  }
  function controle(marque) {
    var soucis = [], d0, sans = diapo.classList.contains('sans-anim');
    diapo.classList.add('sans-anim');
    function boite(el) {
      var r = el.getBoundingClientRect();
      return { g: (r.left - d0.left) / echelle, h: (r.top - d0.top) / echelle, d: (r.right - d0.left) / echelle, b: (r.bottom - d0.top) / echelle };
    }
    function note(bloc, quoi, el) {
      soucis.push({ page: bloc.id || '(sans id)', quoi: quoi, element: decrit(el) });
      if (marque) el.classList.add('dp-souci');
    }
    function examine(bloc) {
      d0 = diapo.getBoundingClientRect();
      $$('.el, .cadre, .panneau, .bulle, .plaque, .tuile, .bouton, .recto, .verso, .depot', bloc).forEach(function (el) {
        if (el.closest('.cache') || el.closest('[data-deborde]')) return;
        var r = boite(el);
        if (r.d - r.g < 1 && r.b - r.h < 1) return;
        if (r.g < -2 || r.h < -2 || r.d > L + 2 || r.b > H + 2) note(bloc, 'dépasse de la scène', el);
        var marge = el.matches('.bulle[data-queue]') ? 26 : 3; /* la queue de la bulle dépasse exprès */
        if (el.scrollHeight > el.clientHeight + marge || el.scrollWidth > el.clientWidth + marge) {
          if (getComputedStyle(el).overflowY !== 'auto') note(bloc, 'contenu trop grand pour son cadre', el);
        }
      });
      var freres = $$(':scope > .el', bloc).filter(function (e) {
        return !e.closest('.cache') && !e.hasAttribute('data-superpose') && (e.textContent || '').trim() && !e.matches('.zone, .point, .eclat');
      });
      for (var i = 0; i < freres.length; i++) for (var j = i + 1; j < freres.length; j++) {
        var a = boite(freres[i]), b = boite(freres[j]);
        var w = Math.min(a.d, b.d) - Math.max(a.g, b.g), h = Math.min(a.b, b.b) - Math.max(a.h, b.h);
        if (w <= 0 || h <= 0) continue;
        var petit = Math.min((a.d - a.g) * (a.b - a.h), (b.d - b.g) * (b.b - b.h));
        if (w * h > 0.12 * petit) note(bloc, 'chevauche ' + decrit(freres[i]), freres[j]);
      }
    }
    pages.forEach(function (p) {
      var active = p.classList.contains('active');
      p.classList.add('active'); examine(p); if (!active) p.classList.remove('active');
    });
    fenetres.forEach(function (f) {
      var active = f.classList.contains('active');
      f.classList.add('active'); examine(f);
      if (f.scrollHeight > f.clientHeight + 3) note(f, 'fenêtre trop remplie', f);
      if (!active) f.classList.remove('active');
    });
    if (!sans) diapo.classList.remove('sans-anim');
    return soucis;
  }

  /* ---------- Démarrage ---------- */
  function demarre() {
    diapo = $('.diapo');
    if (!diapo) return;
    pages = $$(':scope > .page', diapo);
    fenetres = $$(':scope > .fenetre', diapo);
    permanents = $$(':scope > *', diapo).filter(function (e) { return !e.classList.contains('page') && !e.classList.contains('fenetre'); });
    permanents.forEach(function (e) { e.classList.add('permanent'); });
    if (!pages.length) return;
    if (/[?&]fixe\b/.test(location.search)) diapo.classList.add('sans-anim');

    prepare();
    initFenetres(); initQuiz(); initDigicodes(); initCadenas(); initVerrous(); initCartes(); initMinuteurs(); initGlisser();
    infobulle = cree('div', 'infobulle'); infobulle.setAttribute('role', 'tooltip'); diapo.appendChild(infobulle);
    initOutils();

    diapo.addEventListener('click', function (e) {
      var el = e.target.closest(ACTIONS);
      if (el && diapo.contains(el)) { e.preventDefault(); agit(el); return; }
      var info = e.target.closest('[data-info]');
      if (info && window.matchMedia('(hover: none)').matches) { montreInfo(info); setTimeout(cacheInfo, 3500); }
    });
    diapo.addEventListener('mouseover', function (e) { var i = e.target.closest('[data-info]'); if (i) montreInfo(i); });
    diapo.addEventListener('mouseout', function (e) { if (e.target.closest('[data-info]')) cacheInfo(); });
    diapo.addEventListener('focusin', function (e) { var i = e.target.closest('[data-info]'); if (i) montreInfo(i); });
    diapo.addEventListener('focusout', cacheInfo);
    diapo.addEventListener('animationend', function (e) {
      var el = e.target;
      if (el.getAttribute && e.animationName === 'dp-' + el.getAttribute('data-anim')) el.classList.add('dp-fini');
    });
    document.addEventListener('keydown', function (e) {
      var champ = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (e.key === 'Escape') return fermer();
      if (champ) return;
      if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('role') === 'button') { e.preventDefault(); e.target.click(); return; }
      if (/^[0-9]$/.test(e.key) || e.key === 'Backspace') {
        var zone = fenetreOuverte || pages[courante], d = zone && $('.digicode:not(.ouvert)', zone);
        if (d && !d.closest('.cache')) { d.dpFrappe(e.key === 'Backspace' ? 'x' : e.key); return; }
      }
      if (fenetreOuverte || navLibre()) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') aller('suivante');
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') aller('precedente');
    });
    window.addEventListener('resize', ajuste);
    ajuste();

    var depart = indexDe(decodeURIComponent(location.hash || ''));
    courante = -1;
    aller(depart >= 0 ? depart : 0);
    diapo.classList.add('pret');

    window.Diapo = {
      aller: aller, ouvrir: ouvrir, fermer: fermer, controle: controle,
      pages: pages.map(function (p) { return p.id; }),
      fenetres: fenetres.map(function (f) { return f.id; })
    };
    if (/[?&]controle\b/.test(location.search)) {
      setTimeout(function () {
        var s = controle(true), r = cree('div', 'dp-rapport');
        r.textContent = s.length ? s.map(function (x) { return x.page + ' — ' + x.quoi + ' : ' + x.element; }).join('\n') : 'Contrôle : rien à signaler.';
        document.body.appendChild(r);
      }, 300);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarre); else demarre();
})();

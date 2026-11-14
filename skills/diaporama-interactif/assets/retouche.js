/* ==========================================================================
   Diaporama interactif — mode retouche (à la souris)
   S'ouvre avec « ?retouche » au bout de l'adresse ou Ctrl + Alt + E : invisible pour les élèves.
   On déplace, on redimensionne, on corrige un texte en double-cliquant, on change taille,
   couleur et image, puis on télécharge le fichier modifié.

   Principe : au chargement, avant que le moteur ne transforme la page, on garde une copie
   intacte du document (la « source »). Chaque élément affiché connaît son jumeau dans cette
   copie ; chaque retouche est reportée sur le jumeau. Le fichier téléchargé est la copie :
   il reste aussi propre que l'original, sans trace de l'éditeur.
   ========================================================================== */
(function () {
  'use strict';

  var EN_LIGNE = /^(SPAN|B|I|EM|STRONG|SUP|SUB|U|SMALL|A|BR|MARK|CODE)$/;
  var CLIQUABLE = '[data-aller],[data-ouvrir],[data-fermer],[data-lien],[data-montrer],[data-cacher],[data-basculer],.carte,.choix';
  var COTES = ['left', 'top', 'width', 'height'];

  var source = null, jumeaux = new WeakMap(), api = null, diapo = null;
  var actif = false, barre = null, cadre = null, mesure = null, champs = {};
  var sel = null, txt = null, txtAvant = '', cliquable = null, infoEl = null;
  var annulations = [], modifie = false, laisse = false, fantomes = [];

  /* ---------- Jumeaux ---------- */
  function apparie(vivant, copie) {
    jumeaux.set(vivant, copie);
    var a = vivant.children, b = copie.children;
    for (var i = 0; i < a.length && i < b.length; i++) apparie(a[i], b[i]);
  }
  function jumeau(el) { return el ? jumeaux.get(el) : null; }
  function remet(el, nom, valeur) { if (valeur == null) el.removeAttribute(nom); else el.setAttribute(nom, valeur); }

  /* Photographie d'un élément et de son jumeau, pour pouvoir annuler */
  function photo(el) {
    var j = jumeau(el), style = el.style.cssText, classe = el.className;
    var jp = j.getAttribute('data-pos'), js = j.getAttribute('style'), jc = j.getAttribute('class'), jf = j.getAttribute('data-fond');
    return function () {
      el.style.cssText = style; el.className = classe;
      remet(j, 'data-pos', jp); remet(j, 'style', js); remet(j, 'class', jc); remet(j, 'data-fond', jf);
    };
  }
  function note(defaire) { annulations.push(defaire); modifie = true; majBarre(); }
  function dit(message) {
    champs.message.textContent = message || '';
    clearTimeout(dit.t); if (message) dit.t = setTimeout(function () { champs.message.textContent = ''; }, 4500);
  }

  /* Le HTML d'un texte retouché, débarrassé de ce que le moteur et l'éditeur y ont ajouté */
  function propre(html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    Array.prototype.forEach.call(t.content.querySelectorAll('*'), function (e) {
      e.removeAttribute('contenteditable');
      if (e.classList.contains('dp-actif')) { e.removeAttribute('tabindex'); e.removeAttribute('role'); }
      if (e.hasAttribute('data-ico')) { e.innerHTML = ''; e.classList.remove('ico'); }
      Array.prototype.slice.call(e.classList).forEach(function (c) { if (/^dp-/.test(c)) e.classList.remove(c); });
      if (!e.getAttribute('class')) e.removeAttribute('class');
      if (e.getAttribute('style') === '') e.removeAttribute('style');
    });
    return t.innerHTML;
  }

  /* ---------- Que vise le clic ? ---------- */
  function estCadre(el) { return el === diapo || el.classList.contains('page') || el.classList.contains('fenetre'); }
  function mobile(el) {
    return !!el && !!jumeau(el) && !estCadre(el) && (el.classList.contains('el') || el.parentElement === diapo);
  }
  /* Le bloc qu'on sélectionne : le bloc placé le plus proche, sinon l'élément lui-même */
  function bloc(cible) {
    var el;
    for (el = cible; el && el !== diapo; el = el.parentElement) if (mobile(el)) return el;
    for (el = cible; el && el !== diapo; el = el.parentElement) {
      if (jumeau(el) && !estCadre(el) && !EN_LIGNE.test(el.tagName)) return el;
    }
    return null;
  }
  /* Le texte qu'on corrige : un bloc d'un seul tenant (gras, italique, icône admis à l'intérieur) */
  function blocTexte(cible) {
    var el = cible;
    while (el && el !== diapo && EN_LIGNE.test(el.tagName)) el = el.parentElement;
    if (!el || estCadre(el) || !jumeau(el) || !el.textContent.trim()) return null;
    var simple = Array.prototype.every.call(el.children, function (c) { return EN_LIGNE.test(c.tagName) || c.hasAttribute('data-ico'); });
    return simple ? el : null;
  }

  /* ---------- Sélection ---------- */
  function choisit(el, cible) {
    sel = el;
    cliquable = cible && cible.closest ? cible.closest(CLIQUABLE) : null;
    infoEl = cible && cible.closest ? cible.closest('[data-info]') : null;
    if (infoEl && !jumeau(infoEl)) infoEl = null;
    trace(); majBarre();
  }
  function trace() {
    var c = txt || sel;
    if (!actif || !c || !c.isConnected || !c.getClientRects().length) { cadre.style.display = 'none'; return; }
    var r = c.getBoundingClientRect(), d = diapo.getBoundingClientRect(), s = api.echelle();
    cadre.style.display = 'block';
    cadre.style.left = (r.left - d.left) / s + 'px'; cadre.style.top = (r.top - d.top) / s + 'px';
    cadre.style.width = r.width / s + 'px'; cadre.style.height = r.height / s + 'px';
    cadre.classList.toggle('fixe', !mobile(c) || !!txt);
    mesure.textContent = mobile(c)
      ? 'x ' + Math.round(c.offsetLeft) + ' · y ' + Math.round(c.offsetTop) + ' · ' + Math.round(c.offsetWidth) + ' × ' + Math.round(c.offsetHeight)
      : (txt ? 'texte en cours de correction' : 'élément dans un bloc');
  }

  /* ---------- Position et taille ---------- */
  function ecritPos(el) {
    var j = jumeau(el); if (!j) return;
    var v = COTES.map(function (n) {
      var x = el.style[n];
      return !x ? '' : /px$/.test(x) ? String(Math.round(parseFloat(x))) : x;
    });
    while (v.length && !v[v.length - 1]) v.pop();
    j.setAttribute('data-pos', v.map(function (x) { return x || '-'; }).join(','));
    COTES.forEach(function (n) { j.style.removeProperty(n); });
    if (!j.getAttribute('style')) j.removeAttribute('style');
  }
  function guides(parent, lignes) {
    Array.prototype.forEach.call(parent.querySelectorAll(':scope > .dp-guide'), function (g) { g.remove(); });
    (lignes || []).forEach(function (l) {
      var g = document.createElement('div'); g.className = 'dp-guide ' + l.sens;
      g.style[l.sens === 'v' ? 'left' : 'top'] = l.a + 'px'; parent.appendChild(g);
    });
  }
  /* Aimantation : centre et marges de la scène, bords et centres des blocs voisins */
  function aimante(el, x, y) {
    var p = el.offsetParent || diapo, w = el.offsetWidth, h = el.offsetHeight, L = p.clientWidth, H = p.clientHeight;
    var xs = [L / 2], ys = [H / 2], lignes = [];
    if (p.classList.contains('page')) { xs.push(60, L - 60); ys.push(60, H - 60); }
    Array.prototype.forEach.call(p.children, function (v) {
      if (v === el || !v.classList.contains('el') || !v.getClientRects().length) return;
      xs.push(v.offsetLeft, v.offsetLeft + v.offsetWidth / 2, v.offsetLeft + v.offsetWidth);
      ys.push(v.offsetTop, v.offsetTop + v.offsetHeight / 2, v.offsetTop + v.offsetHeight);
    });
    function colle(pos, taille, reperes, sens) {
      var mieux = null;
      [0, taille / 2, taille].forEach(function (d) {
        reperes.forEach(function (r) { var e = r - (pos + d); if (Math.abs(e) <= 5 && (!mieux || Math.abs(e) < Math.abs(mieux.e))) mieux = { e: e, a: r }; });
      });
      if (!mieux) return pos;
      lignes.push({ sens: sens, a: mieux.a });
      return pos + mieux.e;
    }
    x = colle(x, w, xs, 'v'); y = colle(y, h, ys, 'h');
    guides(p, lignes);
    return { x: Math.round(x), y: Math.round(y) };
  }
  function suit(e, bouge, fin) {
    function mv(ev) { bouge(ev); }
    function up(ev) { window.removeEventListener('pointermove', mv, true); window.removeEventListener('pointerup', up, true); window.removeEventListener('pointercancel', up, true); fin(ev); }
    window.addEventListener('pointermove', mv, true); window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
  }
  function debutDeplace(e, el) {
    var s = api.echelle(), x0 = e.clientX, y0 = e.clientY, g0 = el.offsetLeft, h0 = el.offsetTop, parti = false, defaire = photo(el);
    suit(e, function (ev) {
      var dx = (ev.clientX - x0) / s, dy = (ev.clientY - y0) / s;
      if (!parti && Math.abs(dx) + Math.abs(dy) < 3) return;
      parti = true;
      var p = ev.altKey ? { x: Math.round(g0 + dx), y: Math.round(h0 + dy) } : aimante(el, g0 + dx, h0 + dy);
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; trace();
    }, function () {
      guides(el.offsetParent || diapo);
      if (parti) { ecritPos(el); note(defaire); trace(); }
    });
  }
  function debutTaille(e, sens) {
    var el = sel; if (!mobile(el)) return;
    e.preventDefault(); e.stopPropagation();
    var s = api.echelle(), x0 = e.clientX, y0 = e.clientY, w0 = el.offsetWidth, h0 = el.offsetHeight, defaire = photo(el), parti = false;
    var ratio = el.tagName === 'IMG' && sens === 'se' ? h0 / w0 : 0;
    suit(e, function (ev) {
      parti = true;
      var w = Math.max(20, Math.round(w0 + (ev.clientX - x0) / s)), h = Math.max(16, Math.round(h0 + (ev.clientY - y0) / s));
      if (sens !== 's') el.style.width = w + 'px';
      if (ratio) el.style.height = Math.round(w * ratio) + 'px';
      else if (sens !== 'e') el.style.height = h + 'px';
      trace();
    }, function () { if (parti) { ecritPos(el); note(defaire); trace(); } });
  }
  function pousse(dx, dy) {
    if (!mobile(sel)) return;
    var defaire = photo(sel);
    sel.style.left = sel.offsetLeft + dx + 'px'; sel.style.top = sel.offsetTop + dy + 'px';
    ecritPos(sel); note(defaire); trace();
  }

  /* ---------- Texte ---------- */
  function debutTexte(el) {
    finTexte();
    txt = el; txtAvant = el.innerHTML;
    el.setAttribute('contenteditable', 'true'); el.focus({ preventScroll: true });
    trace(); majBarre();
  }
  function finTexte() {
    if (!txt) return;
    var el = txt, j = jumeau(el), avant = txtAvant, jAvant = j.innerHTML;
    txt = null; el.removeAttribute('contenteditable'); el.blur();
    if (!el.textContent.trim()) {
      el.innerHTML = avant; dit('Texte vide refusé : pour enlever un bloc, sélectionne-le puis « Supprimer ».');
    } else if (el.innerHTML !== avant) {
      j.innerHTML = propre(el.innerHTML); apparie(el, j);
      note(function () { el.innerHTML = avant; j.innerHTML = jAvant; apparie(el, j); });
    }
    trace(); majBarre();
  }

  /* ---------- Réglages de l'élément ---------- */
  function cibleStyle() { return txt || sel; }
  function regle(nom, valeur) {
    var el = cibleStyle(); if (!el || !jumeau(el)) return dit('Sélectionne d’abord un élément.');
    var defaire = photo(el);
    el.style[nom] = valeur; jumeau(el).style[nom] = valeur;
    note(defaire); trace();
  }
  function taille(pas) {
    var el = cibleStyle(); if (!el) return dit('Sélectionne d’abord un élément.');
    regle('fontSize', Math.max(8, Math.round(parseFloat(getComputedStyle(el).fontSize)) + pas) + 'px');
  }
  function aligne() {
    var el = cibleStyle(); if (!el) return dit('Sélectionne d’abord un élément.');
    var a = getComputedStyle(el).textAlign;
    regle('textAlign', a === 'center' ? 'right' : a === 'right' || a === 'end' ? 'left' : 'center');
  }
  function supprime() {
    var el = txt || sel; if (!el || !jumeau(el)) return dit('Sélectionne d’abord un élément.');
    if (txt) { txt.removeAttribute('contenteditable'); txt.innerHTML = txtAvant; txt = null; }
    var j = jumeau(el), p = el.parentNode, suivant = el.nextSibling, jp = j.parentNode, jsuivant = j.nextSibling;
    el.remove(); j.remove(); choisit(null);
    note(function () { p.insertBefore(el, suivant); jp.insertBefore(j, jsuivant); });
    dit('Supprimé. « Annuler » le fait revenir.');
  }
  function annule() {
    finTexte();
    var f = annulations.pop(); if (!f) return dit('Plus rien à annuler.');
    f(); trace(); majBarre();
  }

  /* ---------- Ajouts ---------- */
  function ajoute(vivant, copie) {
    var ou = api.ou(), jo = jumeau(ou);
    ou.appendChild(vivant); jo.appendChild(copie); jumeaux.set(vivant, copie);
    note(function () { vivant.remove(); copie.remove(); if (sel === vivant) choisit(null); });
    choisit(vivant);
  }
  function fabrique(balise, x, y, w) {
    var v = document.createElement(balise), c = document.createElement(balise);
    v.className = 'el'; v.style.left = x + 'px'; v.style.top = y + 'px'; v.style.width = w + 'px';
    c.setAttribute('data-pos', x + ',' + y + ',' + w);
    return [v, c];
  }
  function nouveauTexte() {
    finTexte();
    var ou = api.ou(), w = 320, p = fabrique('p', Math.round((ou.clientWidth - w) / 2), Math.round(ou.clientHeight / 2 - 20), w);
    p[0].textContent = p[1].textContent = 'Nouveau texte';
    ajoute(p[0], p[1]); debutTexte(p[0]);
    var r = document.createRange(); r.selectNodeContents(p[0]); var s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  function lisImage(fichier, suite) {
    var lecteur = new FileReader();
    lecteur.onload = function () {
      var url = lecteur.result;
      if (!/^image\/(jpeg|png|webp)$/.test(fichier.type)) return suite(url, 0);
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 1600 / im.naturalWidth), ratio = im.naturalHeight / im.naturalWidth;
        if (k === 1 && fichier.size < 400000) return suite(url, ratio);
        var c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        var reduit = c.toDataURL(fichier.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
        suite(reduit.length < url.length ? reduit : url, ratio);
      };
      im.onerror = function () { dit('Cette image ne se lit pas.'); };
      im.src = url;
    };
    lecteur.readAsDataURL(fichier);
  }
  function demandeImage(suite) {
    var c = document.createElement('input'); c.type = 'file'; c.accept = 'image/*';
    c.addEventListener('change', function () { if (c.files[0]) lisImage(c.files[0], suite); });
    c.click();
  }
  function poseImage(url, ratio) {
    var ou = api.ou(), w = Math.min(420, ou.clientWidth - 120), h = ratio ? Math.round(w * ratio) : 0;
    var i = fabrique('img', Math.round((ou.clientWidth - w) / 2), Math.max(20, Math.round((ou.clientHeight - (h || 300)) / 2)), w);
    i[0].src = url; i[1].setAttribute('src', url); i[0].alt = ''; i[1].setAttribute('alt', '');
    if (h) { i[0].style.height = h + 'px'; i[1].setAttribute('data-pos', i[1].getAttribute('data-pos') + ',' + h); }
    ajoute(i[0], i[1]);
    dit('Image ajoutée : déplace-la, tire le coin pour la redimensionner.');
  }
  function changeImage(url) {
    var el = sel, j = jumeau(el), avant = el.getAttribute('src'), jAvant = j.getAttribute('src');
    el.src = url; j.setAttribute('src', url);
    note(function () { el.setAttribute('src', avant); j.setAttribute('src', jAvant); });
  }
  function changeFond(url) {
    var page = api.ou();
    if (!page.classList.contains('page')) return dit('Le fond se change sur une page, pas dans une fenêtre.');
    var defaire = photo(page);
    Array.prototype.slice.call(page.classList).forEach(function (c) { if (/^fond-/.test(c)) page.classList.remove(c); });
    page.style.backgroundImage = 'url("' + url + '")'; jumeau(page).setAttribute('data-fond', url);
    note(defaire);
  }

  /* ---------- Éléments cachés (ceux qu'une réussite fait apparaître) ---------- */
  function fantome(montre) {
    fantomes.forEach(function (e) { e.classList.add('cache'); e.classList.remove('dp-fantome'); });
    fantomes = [];
    if (montre) {
      Array.prototype.forEach.call(diapo.querySelectorAll('.cache'), function (e) {
        var j = jumeau(e);
        if (j && j.classList.contains('cache')) { e.classList.remove('cache'); e.classList.add('dp-fantome'); fantomes.push(e); }
      });
    }
    champs.caches.classList.toggle('enfonce', !!montre); trace();
  }

  /* ---------- Enregistrer ---------- */
  function telecharge() {
    finTexte();
    var html = '<!doctype html>\n' + source.outerHTML;
    var nom = '';
    try { nom = decodeURIComponent(location.pathname.split('/').pop() || ''); } catch (e) { /* nom par défaut */ }
    if (!/\.html?$/i.test(nom)) nom = 'presentation.html';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    modifie = false; majBarre();
    dit('Fichier téléchargé : c’est lui, désormais, la bonne version.');
  }

  /* ---------- Barre d'outils ---------- */
  function construitBarre() {
    barre = document.createElement('div'); barre.className = 'dp-retouche';
    function groupe() { var g = document.createElement('span'); g.className = 'groupe'; barre.appendChild(g); return g; }
    function bouton(g, texte, titre, action) {
      var b = document.createElement('button'); b.type = 'button'; b.innerHTML = texte; b.title = titre;
      b.addEventListener('click', action); g.appendChild(b); return b;
    }
    function couleur(g, titre, action) {
      var l = document.createElement('label'); l.title = titre; l.className = 'couleur';
      var c = document.createElement('input'); c.type = 'color';
      c.addEventListener('input', function () { action(c.value, false); });
      c.addEventListener('change', function () { action(c.value, true); });
      l.appendChild(c); g.appendChild(l); return c;
    }
    var g = groupe();
    var titre = document.createElement('b'); titre.textContent = 'Retouche'; g.appendChild(titre);
    g = groupe();
    bouton(g, '◀', 'Page précédente', function () { finTexte(); api.aller('precedente'); });
    champs.pages = document.createElement('select'); champs.pages.title = 'Aller à une page ou ouvrir une fenêtre';
    api.pages.forEach(function (id, i) { champs.pages.add(new Option((i + 1) + ' · ' + id, 'p:' + id)); });
    api.fenetres.forEach(function (id) { champs.pages.add(new Option('fenêtre · ' + id, 'f:' + id)); });
    champs.pages.addEventListener('change', function () {
      finTexte(); var v = champs.pages.value;
      if (v[0] === 'f') api.ouvrir(v.slice(2)); else { api.fermer(); api.aller(v.slice(2)); }
      choisit(null); champs.pages.blur();
    });
    g.appendChild(champs.pages);
    bouton(g, '▶', 'Page suivante', function () { finTexte(); api.aller('suivante'); });
    g = groupe();
    bouton(g, '＋ Texte', 'Ajouter un texte sur cette page', nouveauTexte);
    bouton(g, '＋ Image', 'Ajouter une image depuis l’ordinateur', function () { demandeImage(poseImage); });
    champs.image = bouton(g, 'Changer l’image', 'Remplacer l’image sélectionnée', function () { demandeImage(changeImage); });
    bouton(g, 'Fond', 'Mettre une photo en fond de cette page', function () { demandeImage(changeFond); });
    g = groupe();
    bouton(g, 'A−', 'Texte plus petit', function () { taille(-2); });
    bouton(g, 'A+', 'Texte plus grand', function () { taille(2); });
    bouton(g, '⇔', 'Alignement : gauche, centré, droite', aligne);
    var photoCouleur = null;
    champs.couleur = couleur(g, 'Couleur du texte', function (v, fin) {
      var el = cibleStyle(); if (!el || !jumeau(el)) return;
      if (!photoCouleur) photoCouleur = photo(el);
      el.style.color = v; jumeau(el).style.color = v;
      if (fin) { note(photoCouleur); photoCouleur = null; }
    });
    g = groupe();
    champs.suivre = bouton(g, '▶ Suivre', 'Faire ce que fait le clic : ouvrir la fenêtre, changer de page, retourner la carte', function () {
      if (!cliquable) return;
      finTexte(); laisse = true; try { cliquable.click(); } finally { laisse = false; }
      choisit(null);
    });
    champs.caches = bouton(g, 'Cachés', 'Montrer les éléments qui n’apparaissent qu’après une réussite', function () { fantome(!fantomes.length); });
    champs.info = document.createElement('input'); champs.info.type = 'text'; champs.info.placeholder = 'Texte de l’infobulle'; champs.info.title = 'Infobulle de l’élément sélectionné';
    champs.info.addEventListener('change', function () {
      if (!infoEl) return;
      var el = infoEl, j = jumeau(el), avant = el.getAttribute('data-info'), v = champs.info.value.trim();
      if (!v) { champs.info.value = avant; return dit('Infobulle vide refusée.'); }
      el.setAttribute('data-info', v); j.setAttribute('data-info', v);
      note(function () { el.setAttribute('data-info', avant); j.setAttribute('data-info', avant); });
    });
    g.appendChild(champs.info);
    g = groupe();
    var photoAccent = null;
    var l = document.createElement('span'); l.textContent = 'Accent'; g.appendChild(l);
    champs.accent = couleur(g, 'Couleur d’accent de toute la présentation', function (v, fin) {
      if (!photoAccent) photoAccent = photo(diapo);
      diapo.style.setProperty('--accent', v); jumeau(diapo).style.setProperty('--accent', v);
      if (fin) { note(photoAccent); photoAccent = null; }
    });
    g = groupe();
    champs.supprimer = bouton(g, 'Supprimer', 'Enlever l’élément sélectionné (touche Suppr)', supprime);
    champs.annuler = bouton(g, '↶ Annuler', 'Annuler la dernière retouche (Ctrl + Z)', annule);
    g = groupe(); g.classList.add('fin');
    champs.message = document.createElement('span'); champs.message.className = 'message'; g.appendChild(champs.message);
    champs.enregistrer = bouton(g, 'Télécharger', 'Télécharger le fichier modifié', telecharge);
    champs.enregistrer.className = 'principal';
    bouton(g, '✕', 'Quitter la retouche (Ctrl + Alt + E)', ferme);
    document.body.appendChild(barre);

    cadre = document.createElement('div'); cadre.className = 'dp-sel';
    mesure = document.createElement('span'); mesure.className = 'dp-mesure'; cadre.appendChild(mesure);
    ['e', 's', 'se'].forEach(function (sens) {
      var p = document.createElement('i'); p.className = 'dp-poignee ' + sens;
      p.addEventListener('pointerdown', function (e) { debutTaille(e, sens); });
      cadre.appendChild(p);
    });
    diapo.appendChild(cadre);
  }
  function hexa(c) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); if (!m) return '#000000';
    return '#' + [1, 2, 3].map(function (i) { return ('0' + (+m[i]).toString(16)).slice(-2); }).join('');
  }
  function majBarre() {
    if (!barre) return;
    var el = cibleStyle();
    champs.image.hidden = !(sel && sel.tagName === 'IMG');
    champs.suivre.disabled = !cliquable;
    champs.supprimer.disabled = !el;
    champs.annuler.disabled = !annulations.length;
    champs.info.hidden = !infoEl; if (infoEl && document.activeElement !== champs.info) champs.info.value = infoEl.getAttribute('data-info');
    if (el && document.activeElement !== champs.couleur) champs.couleur.value = hexa(getComputedStyle(el).color);
    champs.enregistrer.classList.toggle('alerte', modifie);
    if (document.activeElement !== champs.accent) {
      var acc = getComputedStyle(diapo).getPropertyValue('--accent').trim();
      champs.accent.value = /^#[0-9a-f]{6}$/i.test(acc) ? acc : hexa(acc);
    }
    var ou = api.ou();
    if (ou) champs.pages.value = (ou.classList.contains('fenetre') ? 'f:' : 'p:') + ou.id;
    api.marge(barre.offsetHeight);
  }

  /* ---------- Événements (phase de capture : le moteur ne les voit pas) ---------- */
  function dansEditeur(cible) { return !!(cible.closest && (cible.closest('.dp-retouche') || cible.closest('.dp-sel'))); }
  function surAppui(e) {
    if (!actif || laisse || dansEditeur(e.target) || !diapo.contains(e.target)) return;
    if (txt && txt.contains(e.target)) { e.stopPropagation(); return; }
    e.stopPropagation();
    finTexte();
    var b = bloc(e.target);
    choisit(b, e.target);
    if (b && e.button === 0) { e.preventDefault(); if (mobile(b)) debutDeplace(e, b); }
  }
  function surClic(e) {
    if (!actif || laisse || dansEditeur(e.target) || !diapo.contains(e.target)) return;
    e.stopPropagation(); e.preventDefault();
  }
  function surDouble(e) {
    if (!actif || dansEditeur(e.target) || !diapo.contains(e.target)) return;
    e.stopPropagation(); e.preventDefault();
    if (txt && txt.contains(e.target)) return;
    var t = blocTexte(e.target);
    if (t) {
      debutTexte(t);
      /* le curseur là où l'on a double-cliqué */
      var r = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
      if (r && t.contains(r.startContainer)) { var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    } else dit('Ce bloc contient plusieurs éléments : double-clique sur le texte lui-même.');
  }
  function surTouche(e) {
    if (e.ctrlKey && e.altKey && e.code === 'KeyE') { e.preventDefault(); e.stopPropagation(); if (actif) ferme(); else ouvre(); return; }
    if (!actif) return;
    if (e.target.closest && e.target.closest('.dp-retouche')) { e.stopPropagation(); return; }
    e.stopPropagation();
    var cmd = e.ctrlKey || e.metaKey;
    if (txt) {
      if (e.key === 'Escape') { e.preventDefault(); finTexte(); }
      else if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); }
      else if (e.key === ' ' && txt.tagName === 'BUTTON') { e.preventDefault(); document.execCommand('insertText', false, ' '); }
      return;
    }
    if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); annule(); }
    else if (cmd && e.key.toLowerCase() === 's') { e.preventDefault(); telecharge(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { if (sel) { e.preventDefault(); supprime(); } }
    else if (e.key === 'Escape') { if (sel) choisit(null); else api.fermer(); }
    else if (/^Arrow/.test(e.key) && sel) {
      e.preventDefault(); var p = e.shiftKey ? 10 : 1;
      pousse(e.key === 'ArrowLeft' ? -p : e.key === 'ArrowRight' ? p : 0, e.key === 'ArrowUp' ? -p : e.key === 'ArrowDown' ? p : 0);
    } else if (/^Arrow/.test(e.key)) { api.aller(e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? 'precedente' : 'suivante'); }
  }
  function surColle(e) {
    if (!txt) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  }
  function surQuitte(e) { if (modifie) { e.preventDefault(); e.returnValue = ''; } }

  /* ---------- Ouverture et fermeture ---------- */
  function ouvre() {
    if (actif || !source || !api) return;
    actif = true;
    diapo.classList.add('retouche', 'sans-anim');
    document.body.classList.add('dp-en-retouche'); /* les boutons du lecteur gêneraient les poignées */
    construitBarre(); majBarre();
    dit('Clic : sélectionner et déplacer. Double-clic : corriger un texte.');
  }
  function ferme() {
    if (!actif) return;
    finTexte(); fantome(false); choisit(null);
    actif = false;
    diapo.classList.remove('retouche', 'sans-anim');
    document.body.classList.remove('dp-en-retouche');
    barre.remove(); cadre.remove(); barre = cadre = null;
    api.marge(0);
  }

  window.DiapoRetouche = {
    /* Appelé par le moteur avant toute transformation de la page */
    memorise: function (d) {
      diapo = d; source = document.documentElement.cloneNode(true);
      var copie = source.querySelector('.diapo');
      if (copie) apparie(d, copie); else source = null;
    },
    /* Un élément fabriqué par le moteur qui affiche le contenu d'un élément de la source */
    lie: function (vivant, origine) { var j = jumeau(origine); if (j) jumeaux.set(vivant, j); },
    /* Appelé par le moteur une fois démarré */
    pret: function (a) {
      api = a;
      window.addEventListener('keydown', surTouche, true);
      diapo.addEventListener('pointerdown', surAppui, true);
      diapo.addEventListener('click', surClic, true);
      diapo.addEventListener('dblclick', surDouble, true);
      diapo.addEventListener('paste', surColle, true);
      window.addEventListener('beforeunload', surQuitte);
      window.addEventListener('resize', function () { if (actif) { majBarre(); trace(); } });
      document.addEventListener('diapo:page', function () { if (actif) { choisit(null); if (fantomes.length) fantome(true); } });
      if (/[?&]retouche\b/.test(location.search)) ouvre();
    },
    ouvre: ouvre, ferme: ferme,
    /* Pour les essais : le HTML qui serait téléchargé */
    html: function () { finTexte(); return '<!doctype html>\n' + source.outerHTML; }
  };
})();

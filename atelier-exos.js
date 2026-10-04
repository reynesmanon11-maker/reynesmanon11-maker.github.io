/* ATTENTION — après toute modification de ce fichier, changer le jeton ?v= des
   balises <script> qui l'appellent, dans les pages HTML. Sans cela le
   navigateur des élèves garde l'ancienne version pendant des heures. */

/* ============================================================================
   L'atelier d'entraînement.

   Une série se déroule question par question. On valide, la correction
   s'affiche aussitôt — et on ne peut plus changer sa réponse : réviser, c'est
   se confronter à son erreur, pas la corriger en douce. À la fin, le bilan
   rappelle les questions ratées avec leur explication, parce que c'est la
   seule partie qu'il vaut la peine de relire.

   Six types de question. Chacun fournit trois choses : de quoi se dessiner,
   de quoi dire si l'élève a fini de répondre, et de quoi se corriger.

   Rien n'est envoyé nulle part : tout se passe dans le navigateur de l'élève.
   ========================================================================== */
(function () {
  'use strict';

  const choix = document.getElementById('ex-choix');
  const jeu = document.getElementById('ex-jeu');
  if (!choix || !jeu || !window.EXERCICES) return;

  const ech = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  /* Les énoncés portent du gras et des exposants écrits à la main ; rien de ce
     que tape un élève ne passe par là. */
  const mep = (t) => String(t == null ? '' : t);
  const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];

  /* Deux génotypes sont les mêmes quels que soient l'ordre des allèles, les
     parenthèses, les espaces et le nombre de barres obliques : « vg // vg+ »,
     « (vg+/vg) » et « vg+//vg » décrivent la même drosophile. On corrige une
     méthode, pas une façon d'écrire. */
  function normaliserGenotype(t) {
    return String(t == null ? '' : t)
      .toLowerCase()
      .replace(/[()[\]]/g, '')
      .replace(/\s+/g, '')
      .split(/\/+/)
      .filter(Boolean)
      .sort()
      .join('//');
  }

  const melanger = (tab) => {
    const a = tab.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* Un chromosome répliqué : deux chromatides sœurs tenues par un centromère.
     La hauteur dit la taille, la position du étranglement dit celle du
     centromère, et les lettres sont les allèles portés. Ces trois éléments
     sont précisément les critères d'homologie que l'exercice fait manipuler. */
  function dessinerChromosome(c) {
    const H = 44 + 86 * c.taille;          // hauteur totale en pixels
    const L = 30;                          // largeur du dessin
    const y = 6 + (H - 12) * c.centro;     // hauteur du centromère
    const bras = (x) => `
      <rect x="${x}" y="6" width="8" height="${y - 9}" rx="4" />
      <rect x="${x}" y="${y + 3}" width="8" height="${H - 9 - y}" rx="4" />`;
    return `<svg viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" role="img"
         aria-label="chromosome ${c.id}">
        <g class="chr-bras">${bras(5)}${bras(17)}</g>
        <circle class="chr-centro" cx="15" cy="${y}" r="4.5" />
      </svg>`;
  }

  let serie = null, i = 0, reponses = [];
  let lireReponse = () => null;     // posée par chaque type au moment du dessin

  /* ---- le choix des séries ---------------------------------------------- */
  function dessinerChoix() {
    choix.innerHTML = window.EXERCICES.map((s, k) => `
      <button class="serie" data-serie="${k}">
        <span class="meta">${ech(s.niveau)} · ${ech(s.matiere)}</span>
        <h2>${ech(s.titre)}</h2>
        <p>${ech(s.sous)}</p>
        <span class="nb">${s.questions.length} questions · correction expliquée</span>
      </button>`).join('');
    choix.querySelectorAll('[data-serie]').forEach((b) =>
      b.addEventListener('click', () => commencer(+b.dataset.serie)));
  }

  function commencer(k) {
    serie = window.EXERCICES[k];
    i = 0; reponses = [];
    choix.classList.add('cacher');
    jeu.classList.remove('cacher');
    dessinerQuestion();
  }

  function quitter() {
    serie = null;
    jeu.classList.add('cacher');
    jeu.innerHTML = '';
    choix.classList.remove('cacher');
    choix.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /* ---- le corps de chaque type ------------------------------------------ */
  function corpsQcm(q) {
    return `<div class="ex-opts">` + q.o.map((o, k) =>
      `<button class="ex-opt" data-rep="${k}" aria-pressed="false">
         <span class="lettre">${LETTRES[k]}</span><span>${ech(o)}</span></button>`).join('') + `</div>`;
  }
  const corpsVf = () => `<div class="ex-opts">
      <button class="ex-opt" data-rep="1" aria-pressed="false"><span class="lettre">V</span><span>Vrai</span></button>
      <button class="ex-opt" data-rep="0" aria-pressed="false"><span class="lettre">F</span><span>Faux</span></button>
    </div>`;
  const corpsNum = (q) => `<div class="ex-num">
      <input type="number" inputmode="numeric" id="ex-saisie" aria-label="Votre réponse" placeholder="…" />
      <span class="unite">${ech(q.unite || '')}</span>
    </div>`;

  function corpsCroisement(q) {
    const entete = q.colonnes.map((c) => `<th scope="col">♀ (${ech(c)})</th>`).join('');
    const corps = q.lignes.map((l, li) => `<tr>
        <th scope="row">♂ (${ech(l)})</th>` + q.colonnes.map((c, ci) =>
        `<td><input type="text" class="ex-case" data-li="${li}" data-ci="${ci}"
            autocomplete="off" autocapitalize="off" spellcheck="false"
            aria-label="Case ligne ${li + 1}, colonne ${ci + 1}" /></td>`).join('') + `</tr>`).join('');
    return `${q.aide ? `<p class="ex-aide">${mep(q.aide)}</p>` : ''}
      <div class="ex-grille"><table><thead><tr><td></td>${entete}</tr></thead><tbody>${corps}</tbody></table></div>`;
  }

  function corpsOrdre(q) {
    /* Mélangé à chaque passage — et jamais rendu déjà dans l'ordre. */
    let melange = melanger(q.items);
    if (melange.join('|') === q.items.join('|')) melange = melanger(q.items);
    return `<ul class="ex-ordre">` + melange.map((t) => `
      <li data-item="${ech(t)}"><span class="rang"></span><span class="lib">${ech(t)}</span>
        <span class="fleches">
          <button data-monter aria-label="Monter">↑</button>
          <button data-descendre aria-label="Descendre">↓</button>
        </span></li>`).join('') + `</ul>`;
  }

  function corpsPaires(q) {
    const cartes = melanger(q.chromosomes).map((c) => `
      <button class="chr" data-chr="${c.id}" aria-pressed="false"
        aria-label="Chromosome ${c.id}, allèles ${ech(c.alleles.join(' et '))}">
        <span class="num">${c.id}</span>
        ${dessinerChromosome(c)}
        <span class="all">${c.alleles.map((a) => `<i>${ech(a)}</i>`).join('')}</span>
      </button>`).join('');
    return `${q.aide ? `<p class="ex-aide">${mep(q.aide)}</p>` : ''}
      <div class="chr-table">${cartes}</div>`;
  }

  function corpsTrous(q) {
    const banque = q.banque.slice().sort((a, b) => a.localeCompare(b, 'fr'));
    const texte = mep(q.q).replace(/\{(\d+)\}/g, (_, n) =>
      `<select class="ex-trou" data-trou="${+n - 1}" aria-label="Mot ${n}">
         <option value="">…</option>` +
      banque.map((m) => `<option value="${ech(m)}">${ech(m)}</option>`).join('') + `</select>`);
    return `<p class="ex-texte">${texte}</p>`;
  }

  /* ---- une question ------------------------------------------------------ */
  function dessinerQuestion() {
    const q = serie.questions[i];
    const pct = Math.round((i / serie.questions.length) * 100);
    const corps = q.t === 'qcm' ? corpsQcm(q)
      : q.t === 'vf' ? corpsVf()
      : q.t === 'num' ? corpsNum(q)
      : q.t === 'croisement' ? corpsCroisement(q)
      : q.t === 'ordre' ? corpsOrdre(q)
      : q.t === 'paires' ? corpsPaires(q)
      : corpsTrous(q);

    /* Pour les textes à trous, l'énoncé EST le corps : on ne le répète pas. */
    const enonce = q.t === 'trous'
      ? '<p class="ex-q">Complétez le texte.</p>'
      : `<p class="ex-q">${mep(q.q)}</p>`;

    jeu.innerHTML = `
      <div class="ex-tete">
        <span class="ou">Question ${i + 1} sur ${serie.questions.length} — ${ech(serie.titre)}</span>
        <button data-quitter>Changer de série</button>
      </div>
      <div class="ex-jauge"><i style="width:${pct}%"></i></div>
      ${enonce}
      ${corps}
      <div class="ex-actions"><button class="pill dark noarrow" data-valider disabled><span>Valider</span></button></div>`;

    const valider = jeu.querySelector('[data-valider]');
    jeu.querySelector('[data-quitter]').addEventListener('click', quitter);
    const pret = (ok) => { valider.disabled = !ok; };

    if (q.t === 'num') {
      const champ = jeu.querySelector('#ex-saisie');
      champ.addEventListener('input', () => pret(champ.value.trim() !== ''));
      champ.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !valider.disabled) { e.preventDefault(); valider.click(); }
      });
      champ.focus();
      lireReponse = () => Number(champ.value);

    } else if (q.t === 'qcm' || q.t === 'vf') {
      let choisi = null;
      jeu.querySelectorAll('[data-rep]').forEach((b) => b.addEventListener('click', () => {
        choisi = +b.dataset.rep;
        jeu.querySelectorAll('[data-rep]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        pret(true);
      }));
      lireReponse = () => choisi;

    } else if (q.t === 'croisement') {
      const cases = [...jeu.querySelectorAll('.ex-case')];
      const verifierRemplissage = () => pret(cases.every((c) => c.value.trim() !== ''));
      cases.forEach((c, k) => {
        c.addEventListener('input', verifierRemplissage);
        c.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (k < cases.length - 1) cases[k + 1].focus();
          else if (!valider.disabled) valider.click();
        });
      });
      cases[0].focus();
      lireReponse = () => cases.map((c) => c.value);

    } else if (q.t === 'ordre') {
      const liste = jeu.querySelector('.ex-ordre');
      const renumeroter = () => [...liste.children].forEach((li, k) => {
        li.querySelector('.rang').textContent = k + 1;
        li.querySelector('[data-monter]').disabled = k === 0;
        li.querySelector('[data-descendre]').disabled = k === liste.children.length - 1;
      });
      liste.addEventListener('click', (e) => {
        const b = e.target.closest('[data-monter],[data-descendre]');
        if (!b) return;
        const li = b.closest('li');
        if (b.hasAttribute('data-monter')) li.previousElementSibling?.before(li);
        else li.nextElementSibling?.after(li);
        renumeroter();
        pret(true);
      });
      renumeroter();
      pret(true);   /* l'ordre proposé est déjà une réponse : on peut valider */
      lireReponse = () => [...liste.children].map((li) => li.dataset.item);

    } else if (q.t === 'paires') {
      /* Deux clics forment une paire ; un clic sur une paire la défait. On ne
         dit rien de juste ou de faux avant la validation : sinon l'élève
         trouverait par tâtonnement au lieu de raisonner. */
      const TEINTES = ['t1', 't2', 't3', 't4', 't5', 't6'];
      const cartes = [...jeu.querySelectorAll('.chr')];
      const paires = [];                   // [[idA, idB], …]
      let choisi = null;

      const paireDe = (id) => paires.find((p) => p.indexOf(id) >= 0);

      function redessiner() {
        cartes.forEach((b) => {
          const id = +b.dataset.chr;
          const p = paireDe(id);
          b.className = 'chr' + (p ? ' appariee ' + TEINTES[paires.indexOf(p) % TEINTES.length] : '')
            + (choisi === id ? ' choisi' : '');
          b.setAttribute('aria-pressed', String(choisi === id || !!p));
          const e = b.querySelector('.etiq');
          if (e) e.remove();
          if (p) {
            const t = document.createElement('span');
            t.className = 'etiq';
            t.textContent = 'paire ' + (paires.indexOf(p) + 1);
            b.appendChild(t);
          }
        });
        pret(paires.length * 2 === cartes.length);
      }

      cartes.forEach((b) => b.addEventListener('click', () => {
        const id = +b.dataset.chr;
        const p = paireDe(id);
        if (p) { paires.splice(paires.indexOf(p), 1); choisi = null; return redessiner(); }
        if (choisi === null) { choisi = id; return redessiner(); }
        if (choisi === id) { choisi = null; return redessiner(); }
        paires.push([choisi, id]);
        choisi = null;
        redessiner();
      }));
      redessiner();
      lireReponse = () => paires.map((p) => p.slice());

    } else {
      const trous = [...jeu.querySelectorAll('.ex-trou')];
      const verifierRemplissage = () => pret(trous.every((t) => t.value !== ''));
      trous.forEach((t) => t.addEventListener('change', verifierRemplissage));
      lireReponse = () => trous.map((t) => t.value);
    }

    valider.addEventListener('click', () => corriger(lireReponse()));
  }

  /* ---- la correction ----------------------------------------------------- */
  function corriger(donnee) {
    const q = serie.questions[i];
    let juste, bonne;

    if (q.t === 'qcm' || q.t === 'vf') {
      const attendu = q.t === 'vf' ? (q.r ? 1 : 0) : q.r;
      juste = donnee === attendu;
      bonne = q.t === 'vf' ? (q.r ? 'Vrai' : 'Faux') : LETTRES[q.r] + '. ' + q.o[q.r];
      jeu.querySelectorAll('.ex-opt').forEach((b) => {
        b.disabled = true;
        const k = +b.dataset.rep;
        if (k === attendu) b.classList.add('juste');
        else if (k === donnee) b.classList.add('faux');
      });

    } else if (q.t === 'num') {
      juste = donnee === q.r;
      bonne = String(q.r).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      jeu.querySelector('#ex-saisie').disabled = true;

    } else if (q.t === 'croisement') {
      const attendues = [].concat(...q.cases);
      juste = true;
      [...jeu.querySelectorAll('.ex-case')].forEach((c, k) => {
        c.disabled = true;
        const ok = normaliserGenotype(c.value) === normaliserGenotype(attendues[k]);
        c.classList.add(ok ? 'juste' : 'faux');
        if (!ok) {
          juste = false;
          const attendu = document.createElement('span');
          attendu.className = 'ex-attendu';
          attendu.textContent = attendues[k];
          c.after(attendu);
        }
      });
      bonne = 'voir l’échiquier';

    } else if (q.t === 'ordre') {
      juste = donnee.join('|') === q.items.join('|');
      bonne = 'voir la liste';
      const liste = jeu.querySelector('.ex-ordre');
      liste.classList.add('corrigee');
      [...liste.children].forEach((li, k) => {
        li.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        li.classList.add(li.dataset.item === q.items[k] ? 'juste' : 'faux');
      });
      if (!juste) {
        const bon = document.createElement('ol');
        bon.className = 'ex-bonordre';
        bon.innerHTML = q.items.map((t) => `<li>${ech(t)}</li>`).join('');
        liste.after(bon);
      }

    } else if (q.t === 'paires') {
      const parId = {};
      q.chromosomes.forEach((c) => { parId[c.id] = c; });
      juste = donnee.every(([a, b]) => parId[a].paire === parId[b].paire);
      bonne = 'voir les chromosomes';
      const correct = {};
      donnee.forEach(([a, b]) => {
        const ok = parId[a].paire === parId[b].paire;
        correct[a] = ok; correct[b] = ok;
      });
      jeu.querySelectorAll('.chr').forEach((el) => {
        el.disabled = true;
        const id = +el.dataset.chr;
        el.classList.remove('choisi');
        el.classList.add(correct[id] ? 'juste' : 'faux');
        if (!correct[id]) {
          /* On nomme l'homologue attendu : sans cela l'élève voit qu'il s'est
             trompé sans savoir avec quoi il aurait dû l'apparier. */
          const vrai = q.chromosomes.find((c) => c.paire === parId[id].paire && c.id !== id);
          const t = el.querySelector('.etiq') || el.appendChild(document.createElement('span'));
          t.className = 'etiq attendu';
          t.textContent = 'va avec le ' + vrai.id;
        }
      });

    } else {
      juste = true;
      [...jeu.querySelectorAll('.ex-trou')].forEach((t, k) => {
        t.disabled = true;
        const ok = t.value === q.r[k];
        t.classList.add(ok ? 'juste' : 'faux');
        if (!ok) {
          juste = false;
          const attendu = document.createElement('span');
          attendu.className = 'ex-attendu';
          attendu.textContent = q.r[k];
          t.after(attendu);
        }
      });
      bonne = 'voir le texte';
    }

    reponses.push({ q, juste });

    const corr = document.createElement('div');
    corr.className = 'ex-corr ' + (juste ? 'ok' : 'ko');
    corr.setAttribute('role', 'status');
    const tete = juste ? 'C’est juste.'
      : (q.t === 'croisement' || q.t === 'ordre' || q.t === 'trous' || q.t === 'paires')
        ? 'Pas tout à fait — les réponses attendues sont indiquées ci-dessus.'
        : 'Pas tout à fait — la réponse est : ' + ech(bonne);
    corr.innerHTML = `<span class="verdict">${tete}</span>${mep(q.e)}`;
    jeu.querySelector('.ex-actions').before(corr);

    const act = jeu.querySelector('.ex-actions');
    const dernier = i === serie.questions.length - 1;
    act.innerHTML = `<button class="pill dark noarrow" data-suite><span>${dernier ? 'Voir mon bilan' : 'Question suivante'}</span></button>`;
    const suite = act.querySelector('[data-suite]');
    suite.addEventListener('click', () => { i++; dernier ? dessinerBilan() : dessinerQuestion(); });
    suite.focus();
  }

  /* ---- le bilan ---------------------------------------------------------- */
  function dessinerBilan() {
    const bons = reponses.filter((r) => r.juste).length;
    const n = reponses.length;
    const part = bons / n;
    const mot = part === 1 ? 'Tout est juste. Ces notions-là sont acquises.'
      : part >= 0.75 ? 'Bonne maîtrise d’ensemble. Relisez les questions ci-dessous, ce sont les points qui résistent encore.'
      : part >= 0.5 ? 'La moitié est en place. Les explications ci-dessous reprennent exactement ce qui a manqué.'
      : 'Ces notions demandent encore du travail — c’est normal, elles sont pleines de pièges. Relisez chaque explication, puis refaites la série.';

    const ratees = reponses.filter((r) => !r.juste);
    jeu.innerHTML = `
      <div class="ex-bilan">
        <p class="score">${bons} / ${n}</p>
        <p class="mot">${ech(mot)}</p>
        <div class="ex-actions" style="justify-content:center">
          <button class="pill dark noarrow" data-refaire><span>Refaire la série</span></button>
          <button class="pill outline noarrow" data-quitter><span>Changer de série</span></button>
        </div>
        ${ratees.length ? `<div class="liste">
          <h3>À revoir — ${ratees.length} question${ratees.length > 1 ? 's' : ''}</h3>
          <ul>${ratees.map((r) => `<li><b>${mep(r.q.t === 'trous' ? 'Texte à compléter' : r.q.q)}</b><br>${mep(r.q.e)}</li>`).join('')}</ul>
        </div>` : ''}
      </div>`;
    jeu.querySelector('[data-refaire]').addEventListener('click', () => {
      i = 0; reponses = []; dessinerQuestion();
      jeu.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    jeu.querySelector('[data-quitter]').addEventListener('click', quitter);
  }

  dessinerChoix();
})();

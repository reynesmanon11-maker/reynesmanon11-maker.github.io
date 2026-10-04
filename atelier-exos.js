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

   Rien n'est envoyé nulle part : tout se passe dans le navigateur de l'élève.
   ========================================================================== */
(function () {
  'use strict';

  const choix = document.getElementById('ex-choix');
  const jeu = document.getElementById('ex-jeu');
  if (!choix || !jeu || !window.EXERCICES) return;

  const ech = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];

  /* Les énoncés contiennent du gras et des exposants écrits à la main ; les
     réponses des élèves, jamais. On échappe donc les unes et pas les autres. */
  const mep = (t) => String(t == null ? '' : t);

  let serie = null, i = 0, reponses = [];

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

  /* ---- une question ------------------------------------------------------ */
  function dessinerQuestion() {
    const q = serie.questions[i];
    const pct = Math.round((i / serie.questions.length) * 100);
    let corps;

    if (q.t === 'qcm') {
      corps = `<div class="ex-opts">` + q.o.map((o, k) =>
        `<button class="ex-opt" data-rep="${k}" aria-pressed="false">
           <span class="lettre">${LETTRES[k]}</span><span>${ech(o)}</span></button>`).join('') + `</div>`;
    } else if (q.t === 'vf') {
      corps = `<div class="ex-opts">
        <button class="ex-opt" data-rep="1" aria-pressed="false"><span class="lettre">V</span><span>Vrai</span></button>
        <button class="ex-opt" data-rep="0" aria-pressed="false"><span class="lettre">F</span><span>Faux</span></button>
      </div>`;
    } else {
      corps = `<div class="ex-num">
        <input type="number" inputmode="numeric" id="ex-saisie" aria-label="Votre réponse" placeholder="…" />
        <span class="unite">${ech(q.unite || '')}</span>
      </div>`;
    }

    jeu.innerHTML = `
      <div class="ex-tete">
        <span class="ou">Question ${i + 1} sur ${serie.questions.length} — ${ech(serie.titre)}</span>
        <button data-quitter>Changer de série</button>
      </div>
      <div class="ex-jauge"><i style="width:${pct}%"></i></div>
      <p class="ex-q">${mep(q.q)}</p>
      ${corps}
      <div class="ex-actions"><button class="pill dark noarrow" data-valider disabled><span>Valider</span></button></div>`;

    const valider = jeu.querySelector('[data-valider]');
    jeu.querySelector('[data-quitter]').addEventListener('click', quitter);

    if (q.t === 'num') {
      const champ = jeu.querySelector('#ex-saisie');
      champ.addEventListener('input', () => { valider.disabled = champ.value.trim() === ''; });
      champ.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !valider.disabled) { e.preventDefault(); valider.click(); }
      });
      champ.focus();
      valider.addEventListener('click', () => corriger(Number(champ.value)));
    } else {
      let choisi = null;
      jeu.querySelectorAll('[data-rep]').forEach((b) => b.addEventListener('click', () => {
        choisi = +b.dataset.rep;
        jeu.querySelectorAll('[data-rep]').forEach((x) =>
          x.setAttribute('aria-pressed', String(x === b)));
        valider.disabled = false;
      }));
      valider.addEventListener('click', () => corriger(choisi));
    }
  }

  /* ---- la correction ----------------------------------------------------- */
  function corriger(donnee) {
    const q = serie.questions[i];
    const attendu = q.t === 'vf' ? (q.r ? 1 : 0) : q.r;
    const juste = donnee === attendu;
    reponses.push({ q, donnee, juste });

    /* Plus de retour en arrière : la réponse est posée, on la regarde en face. */
    jeu.querySelectorAll('.ex-opt').forEach((b) => {
      b.disabled = true;
      const k = +b.dataset.rep;
      if (k === attendu) b.classList.add('juste');
      else if (k === donnee) b.classList.add('faux');
    });
    const champ = jeu.querySelector('#ex-saisie');
    if (champ) champ.disabled = true;

    const bonne = q.t === 'vf' ? (q.r ? 'Vrai' : 'Faux')
      : q.t === 'num' ? String(q.r).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      : LETTRES[q.r] + '. ' + q.o[q.r];

    const corr = document.createElement('div');
    corr.className = 'ex-corr ' + (juste ? 'ok' : 'ko');
    corr.setAttribute('role', 'status');
    corr.innerHTML = `<span class="verdict">${juste ? 'C’est juste.' : 'Pas tout à fait — la réponse est : ' + ech(bonne)}</span>${mep(q.e)}`;
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
          <ul>${ratees.map((r) => `<li><b>${mep(r.q.q)}</b><br>${mep(r.q.e)}</li>`).join('')}</ul>
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

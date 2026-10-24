// Un emploi du temps de démonstration, écrit exactement comme Pronote l'exporte (titres,
// descriptions, demi-groupes, élèves d'ULIS, accompagnante, vacances), pour que la démo passe
// par le même chemin que les vraies données. Tout est fictif et daté autour de la semaine en cours.
import { instantDe, ajouteJours, lundiDe, aujourdhui } from './dates.js';

const MATIERE = 'SCIENCES VIE & TERRE';

// [jour 0-4, début, fin, classe, groupe ('' = entière), salle, accompagnant, parties ULIS]
const SEMAINE = [
  [0, '09:20', '10:15', '5G3', 'P2', '107', 'Mme LAMBERT C.'],
  [0, '10:35', '11:30', '5G3', 'P1', '107'],
  [0, '13:55', '14:50', '4G2', '', '107'],
  [1, '10:35', '11:30', '5G1', '', '107'],
  [1, '12:55', '13:50', '6G2', '', '102'],
  [1, '15:05', '16:00', '6G1', '', '107'],
  [2, '08:25', '09:20', '5G1', 'P2', '107'],
  [2, '09:20', '10:15', '5G1', 'P1', '107'],
  [2, '11:30', '12:25', '3G1', '', '107'],
  [3, '08:25', '09:20', '6G2', 'P2', '107'],
  [3, '09:20', '10:15', '6G2', 'P1', '107'],
  [3, '10:35', '11:30', '5G3', '', '107', 'Mme LAMBERT C.', ['ULIS'] ],
  [3, '11:30', '12:25', '3G1', '', '107'],
  [4, '08:25', '09:20', '6G1', 'P1', '107'],
  [4, '09:20', '10:15', '6G1', 'P2', '107'],
  [4, '10:35', '11:30', '4G2', '', '107'],
];

function coursPronote(jour, h0, h1, classe, groupe, salle, accompagnant, ulis, fuseau, annule) {
  const lignes = [`Matière : ${MATIERE}`, 'Professeur : DUPONT A.'];
  let titre;
  if (groupe) {
    lignes.push(`Groupe : [${classe}${groupe}]`, `Partie de classe : <${classe}> ${classe}${groupe}`);
    titre = `${MATIERE} - [${classe}${groupe}] - <${classe}> ${classe}${groupe}`;
  } else if (ulis) {
    const nom = `${classe[0]}0${classe.slice(2)}`;
    const parties = [`<${classe}> ${nom}_G`, `<${classe}> ${nom}_ULIS ARAGO`];
    lignes.push(`Parties de classe : ${parties.join(', ')}`);
    titre = `${MATIERE} - ${parties.join(', ')}`;
  } else {
    lignes.push(`Classe : ${classe}`);
    titre = `${MATIERE} - ${classe}`;
  }
  lignes.push(`Salle : ${salle}`);
  if (accompagnant) lignes.push(`Accompagnant : ${accompagnant}`);
  if (annule) lignes.push('Statut : Cours annulé');
  return {
    id: `demo-${classe}${groupe}-${jour}-${h0}`,
    titre: annule ? `Cours annulé - ${titre}` : titre,
    description: lignes.join('\n'), lieu: salle, statut: 'confirmed', journee: false,
    debut: instantDe(jour, h0, fuseau), fin: instantDe(jour, h1, fuseau), jour0: jour, jour1: jour,
  };
}

const evt = (id, titre, jour, h0, h1, fuseau, description = '') => ({
  id, titre, description, lieu: '', statut: 'confirmed', journee: false,
  debut: instantDe(jour, h0, fuseau), fin: instantDe(jour, h1, fuseau), jour0: jour, jour1: jour,
});
const journee = (id, titre, j0, j1, description = '') => ({ id, titre, description, lieu: '', statut: 'confirmed', journee: true, debut: null, fin: null, jour0: j0, jour1: j1 });

/** Événements Pronote et personnels de la démonstration, de deux semaines avant à huit après. */
export function evenementsDemo(fuseau) {
  const lundi = lundiDe(aujourdhui(fuseau));
  const pronote = [], perso = [];
  const debutVacances = ajouteJours(lundi, 5 * 7 - 2); // un samedi, dans quatre semaines et demie
  const finVacances = ajouteJours(debutVacances, 15);
  for (let s = -2; s <= 8; s++) {
    const l = ajouteJours(lundi, s * 7);
    if (l >= ajouteJours(debutVacances, -1) && l <= finVacances) continue;
    for (const [d, h0, h1, classe, groupe, salle, acc, ulis] of SEMAINE) {
      const jour = ajouteJours(l, d);
      const annule = s === 1 && classe === '3G1' && d === 3; // une sortie des 3e la semaine prochaine
      pronote.push(coursPronote(jour, h0, h1, classe, groupe, salle, acc, ulis, fuseau, annule));
    }
    pronote.push(evt(`demo-com-${s}`, "Heure de com'", l, '09:30', '10:30', fuseau, "Questions à transmettre à l'équipe de direction au plus tard le jeudi."));
    if (s === 0 || s === 2) pronote.push(evt(`demo-cp-${s}`, 'Conseil pédagogique', ajouteJours(l, 1), '17:00', '18:30', fuseau, 'Salle des professeurs.'));
    perso.push(evt(`perso-foot-${s}`, 'Footing', ajouteJours(l, 1), '18:45', '19:45', fuseau));
    perso.push(evt(`perso-dent-${s}`, s === 0 ? 'Dentiste' : 'Piscine', ajouteJours(l, 2), '14:00', '15:00', fuseau));
    perso.push(evt(`perso-repas-${s}`, 'Déjeuner avec Julie', ajouteJours(l, 3), '12:30', '13:30', fuseau));
    perso.push(evt(`perso-marche-${s}`, 'Marché', ajouteJours(l, 5), '10:00', '11:00', fuseau));
  }
  pronote.push(journee('demo-vac', 'Vacances', debutVacances, finVacances));
  pronote.push(journee('demo-parcours', 'PARCOURS CITOYEN : semaine de la laïcité', ajouteJours(lundi, 7), ajouteJours(lundi, 11), 'Activités banalisées en heure de vie de classe.'));
  return { pronote, perso, agendas: { 'demo-perso': { nom: 'Personnel', couleur: '#55606e' } } };
}

const DEMARCHE = ['Situation déclenchante', 'Problème', 'Hypothèses', 'Protocole', 'Résultats', 'Bilan'];
const DOCUMENTAIRE = ['Documents', 'Questions', 'Mise en commun', 'Bilan'];

/** Les données de démonstration : classes et étapes partagées par niveau (sans validations). */
export function donneesDemo(fuseau) {
  const lundi = lundiDe(aujourdhui(fuseau));
  const m = Date.now();
  const docs = {};
  // Le chapitre, le travail à faire et la semaine visée : ce qu'apporte une programmation importée.
  const CHAPITRES = {
    e6a: 'Chapitre 1 — Le vivant et ses caractéristiques', e6f: 'Chapitre 2 — La classification du vivant',
    e5a: 'Chapitre 3 — Respiration et milieux de vie', e5e: 'Chapitre 4 — La nutrition des végétaux',
    e4a: 'Chapitre 1 — Les séismes', e4d: 'Chapitre 2 — Volcans et tectonique des plaques',
    e3a: "Chapitre 1 — L'information génétique", e3d: 'Chapitre 2 — Diversité et stabilité génétique',
  };
  let chapitre = '';
  const etape = (id, e) => {
    chapitre = CHAPITRES[id] || chapitre;
    docs[`etapes/${id}`] = { duree: 1, format: 'indiff', eval: false, insecable: false, jalons: [], photocopies: 0, afaire: '', pronote: '', devoirs: '', cible: '', chapitre, ...e, _m: m };
  };
  // 6e — Le vivant et sa classification
  etape('e6a', { niveau: '6e', titre: 'Activité 1 – Vivant ou non vivant ?', jalons: ['Situation déclenchante', 'Hypothèses', 'Tri des objets', 'Bilan'], pronote: 'Trier des objets et des êtres vivants ; dégager les critères du vivant.' });
  etape('e6b', { niveau: '6e', titre: 'Activité 2 – Les caractéristiques du vivant', duree: 1.5, jalons: DOCUMENTAIRE, photocopies: 2, devoirs: 'Finir le tableau du document 3' });
  etape('e6c', { niveau: '6e', titre: 'Activité 3 – Observer des cellules au microscope', duree: 2, format: 'demi', jalons: ['Protocole', 'Réglage du microscope', 'Observation', "Dessin d'observation", 'Bilan'], afaire: "Microscopes, lames, épiderme d'oignon" });
  etape('e6d', { niveau: '6e', titre: 'Bilan – Le vivant est fait de cellules', duree: 0.5, photocopies: 1, devoirs: 'Apprendre le bilan : l’évaluation porte dessus' });
  etape('e6e', { niveau: '6e', titre: 'Évaluation – Le vivant', eval: true, photocopies: 2, format: 'entiere', cible: ajouteJours(lundi, 7) });
  etape('e6f', { niveau: '6e', titre: 'Activité 4 – Classer les êtres vivants', duree: 1.5, jalons: DOCUMENTAIRE, photocopies: 1 });
  etape('e6g', { niveau: '6e', titre: 'Activité 5 – Construire des groupes emboîtés', duree: 1.5, jalons: ['Collection', 'Attributs', 'Groupes emboîtés', 'Bilan'] });
  etape('e6h', { niveau: '6e', titre: 'Bilan – La classification du vivant', duree: 0.5, photocopies: 1, cible: ajouteJours(lundi, 21) });
  // 5e — Respiration, puis nutrition des végétaux
  etape('e5a', { niveau: '5e', titre: 'Activité 4 – Le sol, un milieu vivant', duree: 1.5, jalons: DEMARCHE, afaire: 'Échantillons de sol, appareil de Berlèse' });
  etape('e5b', { niveau: '5e', titre: "Activité 5 – Respirer dans l'air ou dans l'eau", jalons: DOCUMENTAIRE, photocopies: 2 });
  etape('e5c', { niveau: '5e', titre: 'Bilan du chapitre', duree: 0.5, photocopies: 1, devoirs: 'Apprendre le bilan du chapitre' });
  etape('e5d', { niveau: '5e', titre: 'Évaluation – Respiration et milieux de vie', eval: true, photocopies: 1, format: 'entiere' });
  etape('e5e', { niveau: '5e', titre: 'Activité 6 – Les besoins nutritifs des végétaux', duree: 1.5, jalons: DEMARCHE });
  etape('e5f', { niveau: '5e', titre: "Activité 7 – Mettre en évidence l'amidon dans les feuilles", duree: 2, format: 'demi', insecable: false, jalons: ['Protocole', 'Manipulation', 'Résultats', 'Interprétation'], afaire: 'Eau iodée, feuilles de pélargonium éclairées et à l’obscurité' });
  etape('e5g', { niveau: '5e', titre: 'Bilan – La nutrition des végétaux', duree: 0.5, photocopies: 1, cible: ajouteJours(lundi, 14) });
  // 4e — Séismes, volcans, tectonique
  etape('e4a', { niveau: '4e', titre: 'Activité 1 – Séismes et failles', jalons: ['Documents', 'Modélisation', 'Interprétation', 'Bilan'] });
  etape('e4b', { niveau: '4e', titre: 'Activité 2 – Modéliser une faille', format: 'demi', afaire: 'Pâte à modeler, plaques de bois', devoirs: 'Refaire le schéma de la faille' });
  etape('e4c', { niveau: '4e', titre: 'Évaluation – Les séismes', eval: true, photocopies: 1 });
  etape('e4d', { niveau: '4e', titre: 'Activité 3 – Volcans effusifs et explosifs', duree: 1.5, jalons: DOCUMENTAIRE, photocopies: 2 });
  etape('e4e', { niveau: '4e', titre: 'Activité 4 – La tectonique des plaques', duree: 2, jalons: ['Carte des séismes', 'Carte des volcans', 'Limites de plaques', 'Bilan'] });
  // 3e — Génétique
  etape('e3a', { niveau: '3e', titre: "Activité 1 – L'information génétique", jalons: ['Situation déclenchante', 'Documents', 'Bilan'] });
  etape('e3b', { niveau: '3e', titre: 'Activité 2 – Chromosomes et caryotype', jalons: ['Observation', 'Comparaison', 'Bilan'], photocopies: 1, devoirs: 'Apprendre : chromosome, caryotype, gène' });
  etape('e3c', { niveau: '3e', titre: 'Évaluation – Les chromosomes', eval: true, photocopies: 1 });
  etape('e3d', { niveau: '3e', titre: 'Activité 3 – Gènes, allèles et diversité', duree: 1.5, jalons: DOCUMENTAIRE });
  etape('e3e', { niveau: '3e', titre: 'Activité 4 – Méiose et fécondation', duree: 2, jalons: ['Documents', 'Schéma', 'Brassage', 'Bilan'], photocopies: 2 });

  const file = (prefixe, ids) => ids.map((eid, k) => ({ u: `${prefixe}${k}`, eid }));
  const classe = (code, nom, niveau, effectif, ids) => {
    docs[`classes/${code}`] = { code, nom, niveau, effectif, file: file(code.toLowerCase(), ids), annonces: {}, _m: m };
  };
  const six = ['e6a', 'e6b', 'e6c', 'e6d', 'e6e', 'e6f', 'e6g', 'e6h'];
  const cinq = ['e5a', 'e5b', 'e5c', 'e5d', 'e5e', 'e5f', 'e5g'];
  classe('6G1', '601', '6e', 27, six);
  classe('6G2', '602', '6e', 26, six);
  classe('5G1', '501', '5e', 28, cinq);
  classe('5G3', '503', '5e', 25, cinq);
  classe('4G2', '402', '4e', 29, ['e4a', 'e4b', 'e4c', 'e4d', 'e4e']);
  classe('3G1', '301', '3e', 24, ['e3a', 'e3b', 'e3c', 'e3d', 'e3e']);

  docs.reglages = { debut: ajouteJours(lundi, -7), _m: m };
  docs['taches/t1'] = { texte: 'Demander les clés du labo à la vie scolaire', classe: '', pour: ajouteJours(aujourdhui(fuseau), 1), fait: false, cree: new Date(m).toISOString(), _m: m };
  docs['taches/t2'] = { texte: 'Commander des lames et lamelles', classe: '6G1', pour: ajouteJours(aujourdhui(fuseau), 6), fait: false, cree: new Date(m).toISOString(), _m: m };
  docs['taches/t3'] = { texte: 'Rendre les copies corrigées', classe: '3G1', pour: ajouteJours(aujourdhui(fuseau), -1), fait: true, cree: new Date(m).toISOString(), _m: m };
  docs.notes = { texte: 'Idée : sortie au jardin partagé avec les 5e au printemps (voir la mairie).', _m: m };
  return docs;
}

/**
 * Les validations de la démo, calculées sur son emploi du temps : chaque cours passé est validé
 * « comme prévu », sauf le dernier de deux classes (à valider), et la 601 a pris une demi-séance
 * de retard sur la 602 — pour que « Où en sont mes classes » ait quelque chose à montrer.
 */
export function validationsDemo({ creneaux, plan, maintenant, v }) {
  const docs = {}, m = Date.now();
  const parClasse = {};
  // Seuls les cours suivis comptent : ceux d'avant la date de début du suivi n'ont pas de plan.
  for (const cr of creneaux) if (cr.fin <= maintenant && !cr.annule && plan.parCreneau[cr.cle]) (parClasse[cr.code] ||= []).push(cr);
  const aValider = new Set(['5G3', '6G2']);
  for (const [code, liste] of Object.entries(parClasse)) {
    liste.sort((a, b) => a.debut - b.debut);
    const file = plan.parClasse[code].file;
    const n = aValider.has(code) ? liste.length - 1 : liste.length;
    for (let k = 0; k < n; k++) {
      const cr = liste[k], pc = plan.parCreneau[cr.cle];
      const d = pc.segments[pc.segments.length - 1];
      if (!d) continue;
      let i = file.findIndex((it) => it.u === d.u), f = d.a;
      let note = '';
      if (code === '6G1' && k === n - 1) {
        const e = v.etapes[file[i].eid];
        f = Math.max(0, f - 0.5 / (Number(e.duree) || 1));
        const J = (e.jalons || []).length;
        if (J) f = Math.floor(f * J + 1e-6) / J;
        note = 'Beaucoup de questions : mise en commun à finir.';
      }
      docs[`journal/${cr.cle}`] = { code, jour: cr.jour, arret: { u: file[i].u, f: Math.round(f * 1000) / 1000, rang: i }, note, le: new Date(m).toISOString(), _m: m };
    }
  }
  return docs;
}

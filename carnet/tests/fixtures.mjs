// Une vraie semaine d'emploi du temps Pronote (collège, novembre 2026), telle que l'API Google
// Agenda la renvoie pour un agenda abonné à l'export iCal. Seuls les noms des personnes ont été
// remplacés. Les heures sont en UTC : 08:20Z = 9h20 à Paris en novembre.
const desc = (lignes) => lignes.join('\n') + '\n';

export const semaineGoogle = [
  { id: 'v1', summary: 'Vacances', start: { date: '2026-10-18' }, end: { date: '2026-11-02' }, status: 'confirmed' },
  {
    id: 'c1', summary: 'SCIENCES VIE & TERRE - [5G3P2] - <5G3> 5G3P2', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Groupe : [5G3P2]', 'Partie de classe : &lt;5G3&gt; 5G3P2', 'Salle : 107', 'Accompagnant : Mme MARTIN S.']),
    start: { dateTime: '2026-11-02T08:20:00Z', timeZone: 'UTC' }, end: { dateTime: '2026-11-02T09:15:00Z', timeZone: 'UTC' },
  },
  {
    id: 'e1', summary: "Heure de com'", status: 'confirmed',
    description: "Merci de transmettre vos questions à l'équipe au plus tard le jeudi soir précédent.",
    start: { dateTime: '2026-11-02T08:30:00Z' }, end: { dateTime: '2026-11-02T09:30:00Z' },
  },
  {
    id: 'c2', summary: 'SCIENCES VIE & TERRE - [5G3P1] - <5G3> 5G3P1', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Groupe : [5G3P1]', 'Partie de classe : &lt;5G3&gt; 5G3P1', 'Salle : 107']),
    start: { dateTime: '2026-11-02T09:35:00Z' }, end: { dateTime: '2026-11-02T10:30:00Z' },
  },
  {
    id: 'c3', summary: 'SCIENCES VIE & TERRE - 5G1', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Classe : 5G1', 'Salle : 107']),
    start: { dateTime: '2026-11-03T09:35:00Z' }, end: { dateTime: '2026-11-03T10:30:00Z' },
  },
  {
    id: 'c4', summary: 'SCIENCES VIE & TERRE - 6G2', location: '102', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Classe : 6G2', 'Salle : 102']),
    start: { dateTime: '2026-11-03T11:55:00Z' }, end: { dateTime: '2026-11-03T12:50:00Z' },
  },
  {
    id: 'c5', summary: 'SCIENCES VIE & TERRE - 6G3', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Classe : 6G3', 'Salle : 107']),
    start: { dateTime: '2026-11-03T14:05:00Z' }, end: { dateTime: '2026-11-03T15:00:00Z' },
  },
  {
    id: 'c6', summary: 'SCIENCES VIE & TERRE - [5G1P2] - <5G1> 5G1P2', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Groupe : [5G1P2]', 'Partie de classe : &lt;5G1&gt; 5G1P2', 'Salle : 107', 'Accompagnant : Mme PETIT N.']),
    start: { dateTime: '2026-11-04T07:25:00Z' }, end: { dateTime: '2026-11-04T08:20:00Z' },
  },
  {
    id: 'c7', summary: 'SCIENCES VIE & TERRE - [5G1P1] - <5G1> 5G1P1', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Groupe : [5G1P1]', 'Partie de classe : &lt;5G1&gt; 5G1P1', 'Salle : 107']),
    start: { dateTime: '2026-11-04T08:20:00Z' }, end: { dateTime: '2026-11-04T09:15:00Z' },
  },
  {
    id: 'c8', summary: 'SCIENCES VIE & TERRE - 5G4', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Classe : 5G4', 'Salle : 107']),
    start: { dateTime: '2026-11-04T10:30:00Z' }, end: { dateTime: '2026-11-04T11:25:00Z' },
  },
  {
    id: 'e2', summary: 'PARCOURS CITOYEN: QUESTIONNAIRE', status: 'confirmed',
    description: 'Du 05 au 25 novembre 2026, les élèves seront invités à remplir un questionnaire.',
    start: { date: '2026-11-05' }, end: { date: '2026-11-26' },
  },
  {
    id: 'c9', summary: 'SCIENCES VIE & TERRE - [6G2P2] - <6G2> 6G2P2', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Groupe : [6G2P2]', 'Partie de classe : &lt;6G2&gt; 6G2P2', 'Salle : 107']),
    start: { dateTime: '2026-11-05T07:25:00Z' }, end: { dateTime: '2026-11-05T08:20:00Z' },
  },
  {
    id: 'c10', summary: 'SCIENCES VIE & TERRE - [6G2P1] - <6G2> 6G2P1', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Groupe : [6G2P1]', 'Partie de classe : &lt;6G2&gt; 6G2P1', 'Salle : 107']),
    start: { dateTime: '2026-11-05T08:20:00Z' }, end: { dateTime: '2026-11-05T09:15:00Z' },
  },
  {
    id: 'c11', summary: 'SCIENCES VIE & TERRE - <5G3> 503_G, <5G3> 503_ULIS GALVANI, <5G3> 503_ULIS LEPELLETIER', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Parties de classe : &lt;5G3&gt; 503_G, &lt;5G3&gt; 503_ULIS GALVANI, &lt;5G3&gt; 503_ULIS LEPELLETIER', 'Salle : 107', 'Accompagnant : Mme MARTIN S.']),
    start: { dateTime: '2026-11-05T09:35:00Z' }, end: { dateTime: '2026-11-05T10:30:00Z' },
  },
  {
    id: 'c12', summary: 'SCIENCES VIE & TERRE - 3G4', location: '107', status: 'confirmed',
    description: desc(['Matière : SCIENCES VIE &amp; TERRE', 'Professeur : DURAND M.', 'Classe : 3G4', 'Salle : 107', 'Accompagnant : Mme MARTIN S.']),
    start: { dateTime: '2026-11-05T10:30:00Z' }, end: { dateTime: '2026-11-05T11:25:00Z' },
  },
];

// Les mêmes cours, tels qu'un fichier .ics les écrirait (lignes repliées, échappements, TZID).
export const extraitIcs = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Index Education//PRONOTE//FR',
  'X-WR-CALNAME:Calendrier - DURAND M. - du 01 septembre 2026 au 02 juillet 2027',
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Paris',
  'END:VTIMEZONE',
  'BEGIN:VEVENT',
  'UID:Cours-1-20261102',
  'DTSTART;TZID=Europe/Paris:20261102T092000',
  'DTEND;TZID=Europe/Paris:20261102T101500',
  'SUMMARY:SCIENCES VIE & TERRE - [5G3P2] - <5G3> 5G3P2',
  'LOCATION:107',
  'DESCRIPTION:Matière : SCIENCES VIE & TERRE\\nProfesseur : DURAND M.\\nGroupe : [5G3P2]\\nPartie',
  '  de classe : <5G3> 5G3P2\\nSalle : 107\\nAccompagnant : Mme MARTIN S.\\n',
  'BEGIN:VALARM',
  'ACTION:DISPLAY',
  'DESCRIPTION:Rappel',
  'END:VALARM',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:Cours-2-20261103',
  'DTSTART:20261103T093500Z',
  'DTEND:20261103T103000Z',
  'SUMMARY:SCIENCES VIE & TERRE - 5G1',
  'DESCRIPTION:Matière : SCIENCES VIE & TERRE\\nClasse : 5G1\\nSalle : 107',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:Vac-1',
  'DTSTART;VALUE=DATE:20261219',
  'DTEND;VALUE=DATE:20270104',
  'SUMMARY:Vacances',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:Cours-3-annule',
  'DTSTART;TZID=Europe/Paris:20261105T112000',
  'DURATION:PT55M',
  'SUMMARY:SCIENCES VIE & TERRE - 3G4',
  'STATUS:CANCELLED',
  'DESCRIPTION:Matière : SCIENCES VIE & TERRE\\nClasse : 3G4\\nSalle : 107\\nStatut : Cours annulé',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

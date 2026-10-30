// Réglages de déploiement. Pour activer la connexion Google, il suffit de remplir
// googleClientId (pas à pas : brancher-google.html). Vide, l'appli marche en mode démo et en mode local.
export const CONFIG = {
  // Identifiant OAuth « Application Web » de la console Google Cloud. Il n'est pas secret :
  // une appli web le montre forcément ; c'est la liste des origines autorisées qui protège.
  googleClientId: '505884320884-v1nfced1bhgupeqfolrbtldfg4mesc58.apps.googleusercontent.com',
  // Adresse publique de l'appli : liens « Où en est-on ? » écrits dans Google Agenda, retour de la
  // connexion Google, lien et QR code de partage. Vide : l'adresse de la page en cours.
  urlPublique: 'https://reynesmanon11-maker.github.io/carnet/',
  // Relais facultatif pour lire un lien iCal Pronote sans passer par Google (voir relais/).
  relaisIcal: '',
  // Tant que l'appli Google est « en test », seules les adresses inscrites dans la console peuvent
  // se connecter : l'écran de connexion et le message de partage disent à qui demander.
  phaseEssai: true,
  responsable: 'Manon Reynes',
  // Connexion Google : 'auto' (une fenêtre ; une redirection dans l'appli installée sur Android),
  // ou 'fenetre' / 'redirection' pour l'imposer à tous.
  connexion: 'auto',
  // Page de présentation : ouvre directement la démo au lieu de la mise en route.
  apercu: false,
  version: '0.7.4',
};

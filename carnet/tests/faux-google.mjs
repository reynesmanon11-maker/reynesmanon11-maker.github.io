// Un faux Google pour les tests : Agenda v3 et Drive v3 (dossier appDataFolder), tels que
// l'appli les appelle, avec un état en mémoire partagé entre plusieurs « appareils ».
// Il tient le journal des appels pour vérifier ce qui a été écrit, et où.

export function fauxGoogle({ agendas, refusCreations = 0 }) {
  const etat = {
    creations: 0, refus: refusCreations, // Google refuse parfois un 2e agenda créé dans la foulée
    agendas: structuredClone(agendas), // id → { summary, description, accessRole, primary, backgroundColor, evenements: [] }
    fichiers: {},                       // id → { name, contenu, modifiedTime }
    appels: [],
    n: 0,
  };
  const id = (p) => `${p}${++etat.n}`;
  const entree = (cid, a) => ({ id: cid, summary: a.summary, description: a.description || '', accessRole: a.accessRole || 'owner', primary: !!a.primary, backgroundColor: a.backgroundColor || '#9fe1e7', foregroundColor: a.foregroundColor || '#000000' });
  // Avec calendar.events, on écrit dans tout agenda dont on est propriétaire ou rédacteur ; jamais dans un agenda abonné (Pronote).
  const ecrivable = (a) => a.creeParAppli || ['owner', 'writer'].includes(a.accessRole || 'owner');
  const instant = (x) => (x.dateTime ? Date.parse(x.dateTime) : Date.parse(`${String(x.date).slice(0, 10)}T00:00:00Z`));

  function repondre(route, statut, corps) {
    return route.fulfill({
      status: statut,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS', 'Content-Type': 'application/json' },
      body: corps == null ? '' : typeof corps === 'string' ? corps : JSON.stringify(corps),
    });
  }

  async function gerer(route) {
    const req = route.request();
    const methode = req.method();
    if (methode === 'OPTIONS') return repondre(route, 204, null);
    const u = new URL(req.url());
    const chemin = decodeURIComponent(u.pathname);
    const q = Object.fromEntries(u.searchParams);
    const corps = req.postData();
    etat.appels.push({ methode, chemin, q });
    if (!/^Bearer jeton-test/.test(req.headers().authorization || '')) return repondre(route, 401, { error: { message: 'Pas de jeton' } });
    let m;
    if (chemin === '/oauth2/v3/userinfo') return repondre(route, 200, { email: 'prof.test@gmail.com' });

    // ----- Agenda -----
    if (chemin === '/calendar/v3/users/me/calendarList' && methode === 'GET') {
      return repondre(route, 200, { items: Object.entries(etat.agendas).map(([k, a]) => entree(k, a)) });
    }
    if ((m = chemin.match(/^\/calendar\/v3\/users\/me\/calendarList\/(.+)$/)) && methode === 'PATCH') {
      const a = etat.agendas[m[1]];
      if (!a) return repondre(route, 404, { error: { message: 'Not Found' } });
      if (!a.creeParAppli) return repondre(route, 403, { error: { message: 'Insufficient Permission' } });
      const b = JSON.parse(corps || '{}');
      if (q.colorRgbFormat === 'true') { a.backgroundColor = b.backgroundColor; a.foregroundColor = b.foregroundColor; }
      return repondre(route, 200, entree(m[1], a));
    }
    if (chemin === '/calendar/v3/calendars' && methode === 'POST') {
      if (etat.creations >= 1 && etat.refus > 0) {
        etat.refus--;
        return repondre(route, 403, { error: { code: 403, message: 'Calendar usage limits exceeded.', errors: [{ domain: 'usageLimits', reason: 'quotaExceeded', message: 'Calendar usage limits exceeded.' }] } });
      }
      etat.creations++;
      const b = JSON.parse(corps);
      const cid = `${id('carnet')}@group.calendar.google.com`;
      etat.agendas[cid] = { summary: b.summary, description: b.description, timeZone: b.timeZone, accessRole: 'owner', creeParAppli: true, evenements: [] };
      return repondre(route, 200, { id: cid, summary: b.summary });
    }
    if ((m = chemin.match(/^\/calendar\/v3\/calendars\/([^/]+)$/)) && methode === 'PATCH') {
      const a = etat.agendas[m[1]];
      if (!a) return repondre(route, 404, { error: { message: 'Not Found' } });
      if (!a.creeParAppli) return repondre(route, 403, { error: { message: 'Insufficient Permission' } });
      const b = JSON.parse(corps || '{}');
      if (b.summary != null) a.summary = b.summary;
      if (b.description != null) a.description = b.description;
      etat.renommages = (etat.renommages || 0) + 1;
      return repondre(route, 200, { id: m[1], summary: a.summary, description: a.description });
    }
    if ((m = chemin.match(/^\/calendar\/v3\/calendars\/([^/]+)$/)) && methode === 'DELETE') {
      if (!etat.agendas[m[1]] || !etat.agendas[m[1]].creeParAppli) return repondre(route, 403, { error: { message: 'Forbidden' } });
      delete etat.agendas[m[1]];
      return repondre(route, 204, null);
    }
    if ((m = chemin.match(/^\/calendar\/v3\/calendars\/([^/]+)\/events$/))) {
      const a = etat.agendas[m[1]];
      if (!a) return repondre(route, 404, { error: { message: 'Not Found' } });
      if (methode === 'GET') {
        const t0 = q.timeMin ? Date.parse(q.timeMin) : -Infinity, t1 = q.timeMax ? Date.parse(q.timeMax) : Infinity;
        let items = a.evenements.filter((e) => instant(e.end) > t0 && instant(e.start) < t1);
        if (q.privateExtendedProperty) {
          const [k, v] = q.privateExtendedProperty.split('=');
          items = items.filter((e) => e.extendedProperties && e.extendedProperties.private && e.extendedProperties.private[k] === v);
        }
        items.sort((x, y) => instant(x.start) - instant(y.start));
        return repondre(route, 200, { items, updated: '2026-11-04T06:00:00.000Z' });
      }
      if (methode === 'POST') {
        if (!ecrivable(a)) return repondre(route, 403, { error: { message: 'Forbidden: reader' } });
        const e = { ...JSON.parse(corps), id: id('ev'), status: 'confirmed' };
        a.evenements.push(e);
        return repondre(route, 200, e);
      }
    }
    if ((m = chemin.match(/^\/calendar\/v3\/calendars\/([^/]+)\/events\/([^/]+)$/))) {
      const a = etat.agendas[m[1]];
      if (!a) return repondre(route, 404, { error: { message: 'Not Found' } });
      if (!ecrivable(a)) return repondre(route, 403, { error: { message: 'Forbidden: reader' } });
      const k = a.evenements.findIndex((e) => e.id === m[2]);
      if (k < 0) return repondre(route, 404, { error: { message: 'Not Found' } });
      if (methode === 'PATCH') { a.evenements[k] = { ...a.evenements[k], ...JSON.parse(corps), id: m[2] }; return repondre(route, 200, a.evenements[k]); }
      if (methode === 'PUT') { a.evenements[k] = { ...JSON.parse(corps), id: m[2], status: 'confirmed' }; return repondre(route, 200, a.evenements[k]); }
      if (methode === 'DELETE') { a.evenements.splice(k, 1); return repondre(route, 204, null); }
    }

    // ----- Drive : dossier caché de l'appli -----
    if (chemin === '/drive/v3/files' && methode === 'GET') {
      if (q.spaces !== 'appDataFolder') return repondre(route, 403, { error: { message: 'Seul appDataFolder est autorisé' } });
      const nom = (q.q.match(/name='([^']+)'/) || [])[1];
      const files = Object.entries(etat.fichiers).filter(([, f]) => f.name === nom).map(([k, f]) => ({ id: k, name: f.name, modifiedTime: f.modifiedTime }));
      return repondre(route, 200, { files });
    }
    if ((m = chemin.match(/^\/drive\/v3\/files\/([^/]+)$/)) && methode === 'GET' && q.alt === 'media') {
      const f = etat.fichiers[m[1]];
      return f ? repondre(route, 200, f.contenu) : repondre(route, 404, { error: { message: 'Not Found' } });
    }
    if (chemin === '/upload/drive/v3/files' && methode === 'POST' && q.uploadType === 'multipart') {
      const parts = corps.split(/--carnet[a-z0-9]+/).map((x) => x.trim()).filter((x) => x && x !== '--');
      const json = parts.map((x) => x.slice(x.indexOf('{')));
      const meta = JSON.parse(json[0]);
      if (!(meta.parents || []).includes('appDataFolder')) return repondre(route, 403, { error: { message: 'Hors appDataFolder' } });
      const fid = id('fichier');
      etat.fichiers[fid] = { name: meta.name, contenu: json[1], modifiedTime: new Date().toISOString() };
      return repondre(route, 200, { id: fid, modifiedTime: etat.fichiers[fid].modifiedTime });
    }
    if ((m = chemin.match(/^\/upload\/drive\/v3\/files\/([^/]+)$/)) && methode === 'PATCH') {
      const f = etat.fichiers[m[1]];
      if (!f) return repondre(route, 404, { error: { message: 'Not Found' } });
      f.contenu = corps; f.modifiedTime = new Date().toISOString();
      return repondre(route, 200, { id: m[1], modifiedTime: f.modifiedTime });
    }
    return repondre(route, 400, { error: { message: `Appel inattendu : ${methode} ${chemin}` } });
  }

  // La bibliothèque Google Identity Services, réduite à ce que l'appli utilise.
  const gis = `window.google = { accounts: { oauth2: {
    initTokenClient: (cfg) => ({ requestAccessToken: () => setTimeout(() => cfg.callback({ access_token: 'jeton-test', expires_in: 3599, scope: cfg.scope, token_type: 'Bearer' }), 20) }),
    hasGrantedAllScopes: () => true,
    revoke: (t, f) => f && f(),
  } } };`;

  return {
    etat,
    async brancher(ctx) {
      await ctx.route('https://accounts.google.com/gsi/client', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: gis }));
      await ctx.route('https://www.googleapis.com/**', gerer);
    },
    ecritures: () => etat.appels.filter((a) => a.methode !== 'GET' && a.methode !== 'OPTIONS'),
    vider() { etat.appels.length = 0; },
  };
}

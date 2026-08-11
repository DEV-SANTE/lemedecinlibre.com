/* =====================================================================
   SERVICE DES FICHIERS DU SITE
   ---------------------------------------------------------------------
   POURQUOI LE MÊME SERVEUR SERT LES PAGES ET L'API

   Le cookie de session est SameSite=Strict : le navigateur ne l'envoie
   qu'aux requêtes du même site. Si les pages venaient de GitHub Pages et
   l'API d'un autre domaine, le cookie ne serait jamais transmis et rien
   ne fonctionnerait. On pourrait relâcher la règle et ouvrir le partage
   entre origines, mais ce serait affaiblir la protection contre les
   requêtes forgées depuis un autre site, sur une application qui
   manipule des données de santé.

   Donc un seul domaine, un seul serveur, et pas de partage entre
   origines à configurer. C'est plus simple ET plus sûr.
   ===================================================================== */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.jpg':  'image/jpeg', '.jpeg': 'image/jpeg',
  '.png':  'image/png',  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.ico':  'image/x-icon',
};

/* Jamais servis, même si le fichier existe : outil de contrôle interne
   et notes internes. Même liste que la configuration nginx. */
const INTERDITS = [
  'plateforme/verifier.js',
  'README.md',
  '.version',
];

function servir(racine) {
  const racineReelle = fs.realpathSync(racine);

  return function (req, res, cheminUrl) {
    let rel = decodeURIComponent(cheminUrl.replace(/^\/+/, ''));
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';

    if (INTERDITS.includes(rel)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end('{"erreur":"introuvable"}');
    }

    const cible = path.join(racineReelle, rel);

    /* Un chemin doit rester sous la racine. Sans ce contrôle, une requête
       du type /../../etc/passwd remonterait dans le système de fichiers. */
    if (!cible.startsWith(racineReelle + path.sep) && cible !== racineReelle) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end('{"erreur":"chemin refusé"}');
    }

    fs.stat(cible, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end('<!doctype html><meta charset="utf-8"><title>Page introuvable</title>'
          + '<p style="font:15px system-ui;padding:40px">Page introuvable.');
      }
      const ext = path.extname(cible).toLowerCase();
      const entetes = {
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      };
      /* Les pages ne sont pas mises en cache : elles portent les jetons de
         version des scripts. Les fichiers versionnés le sont une heure —
         durée courte volontairement, on est en développement. */
      entetes['Cache-Control'] = ext === '.html' ? 'no-cache, must-revalidate' : 'public, max-age=3600';
      res.writeHead(200, entetes);
      fs.createReadStream(cible).pipe(res);
    });
  };
}

module.exports = { servir, INTERDITS };

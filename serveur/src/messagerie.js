/* =====================================================================
   MESSAGERIE — ENVOI DE COURRIELS
   ---------------------------------------------------------------------
   Ce module s'appelle « messagerie » et non « courriel » pour une raison
   pratique : « courriel » désigne une adresse électronique dans tout le
   reste du code, et l'import du module était masqué par la variable
   locale du même nom dans la route de réinitialisation. L'erreur ne se
   voyait qu'à l'exécution, sous la forme d'un « n'est pas une fonction ».

   Une seule interface, envoyer(), et trois transports selon
   l'environnement. Aucune dépendance : le transport SMTP parle le
   protocole directement, ce qui évite d'ajouter une bibliothèque de plus
   à auditer dans un projet de santé.

   CE QUE CES MESSAGES NE CONTIENNENT JAMAIS
   Aucune donnée de santé. Ni réponse, ni résultat, ni avis, ni même le
   fait qu'un dossier existe. Un courriel voyage en clair sur des serveurs
   qui ne nous appartiennent pas et reste des années dans une boîte de
   réception — c'est le dernier endroit où mettre une information de
   santé. Un contrôle automatique refuse tout message contenant les mots
   qui trahiraient un contenu médical.

   TRANSPORTS
   « journal »  développement : le message est écrit dans la console.
   « fichier »  recette : chaque message devient un fichier, ce qui permet
                de vérifier ce qui aurait été envoyé.
   « smtp »     production : COURRIEL_SMTP=hote:port, et les identifiants
                dans COURRIEL_UTILISATEUR / COURRIEL_MOTDEPASSE.
   ===================================================================== */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const tls = require('node:tls');

const EXPEDITEUR = process.env.COURRIEL_EXPEDITEUR || 'ne-pas-repondre@dev-sante.fr';

/* Mots qui ne doivent jamais apparaître dans un courriel sortant. La liste
   est volontairement large : mieux vaut refuser un message anodin que
   laisser passer un résultat. */
const INTERDITS = [
  'glycémie', 'glycemie', 'cholestérol', 'cholesterol', 'ferritine', 'hémoglobine',
  'hemoglobine', 'diagnostic', 'pathologie', 'ordonnance', 'résultat d', 'resultat d',
  'votre dossier contient', 'votre avis médical', 'g/l', 'mmol', 'µg/l',
];

function verifierContenu(sujet, texte) {
  const tout = ((sujet || '') + ' ' + (texte || '')).toLowerCase();
  const trouves = INTERDITS.filter((m) => tout.includes(m));
  if (trouves.length) {
    throw new Error('Courriel refusé : il contiendrait une information de santé ('
      + trouves.join(', ') + '). Un courriel ne doit jamais en transporter.');
  }
}

function transportChoisi() {
  if (process.env.COURRIEL_SMTP) return 'smtp';
  if (process.env.COURRIEL_DOSSIER) return 'fichier';
  return 'journal';
}

async function envoyer({ a, sujet, texte }) {
  if (!a || !sujet || !texte) throw new Error('destinataire, sujet et texte sont requis');
  verifierContenu(sujet, texte);

  const transport = transportChoisi();
  const message = { de: EXPEDITEUR, a, sujet, texte, quand: new Date().toISOString(), transport };

  if (transport === 'journal') {
    console.log('\n──────── courriel (non envoyé, transport « journal ») ────────');
    console.log('À      : ' + a);
    console.log('Sujet  : ' + sujet);
    console.log(texte.replace(/^/gm, '  '));
    console.log('─────────────────────────────────────────────────────────────\n');
    return message;
  }

  if (transport === 'fichier') {
    const dossier = process.env.COURRIEL_DOSSIER;
    fs.mkdirSync(dossier, { recursive: true });
    const nom = Date.now() + '-' + a.replace(/[^a-z0-9]/gi, '_') + '.txt';
    fs.writeFileSync(path.join(dossier, nom),
      'De: ' + EXPEDITEUR + '\nÀ: ' + a + '\nSujet: ' + sujet + '\n\n' + texte, 'utf8');
    message.fichier = nom;
    return message;
  }

  await envoyerSmtp(message);
  return message;
}

/* SMTP minimal : EHLO, STARTTLS si nécessaire, AUTH LOGIN, MAIL, DATA.
   Suffisant pour des messages transactionnels en texte simple. */
function envoyerSmtp(message) {
  const [hote, portTexte] = String(process.env.COURRIEL_SMTP).split(':');
  const port = Number(portTexte || 587);
  const utilisateur = process.env.COURRIEL_UTILISATEUR;
  const motDePasse = process.env.COURRIEL_MOTDEPASSE;

  return new Promise((resolve, reject) => {
    let prise = port === 465
      ? tls.connect({ host: hote, port, servername: hote })
      : net.connect({ host: hote, port });
    let etape = 0;
    let tampon = '';
    const encodeUtf8 = (s) => '=?UTF-8?B?' + Buffer.from(s, 'utf8').toString('base64') + '?=';

    const suite = [
      () => 'EHLO plateforme-prevention',
      () => (port === 465 ? null : 'STARTTLS'),
      () => (utilisateur ? 'AUTH LOGIN' : null),
      () => (utilisateur ? Buffer.from(utilisateur).toString('base64') : null),
      () => (utilisateur ? Buffer.from(motDePasse || '').toString('base64') : null),
      () => 'MAIL FROM:<' + message.de + '>',
      () => 'RCPT TO:<' + message.a + '>',
      () => 'DATA',
      () => 'From: ' + message.de + '\r\nTo: ' + message.a
          + '\r\nSubject: ' + encodeUtf8(message.sujet)
          + '\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n'
          + message.texte.replace(/\r?\n\./g, '\n..') + '\r\n.',
      () => 'QUIT',
    ];

    const avancer = () => {
      while (etape < suite.length) {
        const commande = suite[etape++]();
        if (commande === null) continue;              /* étape sans objet */
        if (commande === 'STARTTLS') {
          prise.write('STARTTLS\r\n');
          return;
        }
        prise.write(commande + '\r\n');
        return;
      }
      resolve(message);
    };

    prise.setTimeout(15000, () => { prise.destroy(); reject(new Error('SMTP : délai dépassé')); });
    prise.on('error', reject);
    prise.on('data', (d) => {
      tampon += d.toString();
      if (!/\r\n$/.test(tampon)) return;
      const lignes = tampon.trim().split('\r\n');
      const derniere = lignes[lignes.length - 1];
      tampon = '';
      if (/^[45]/.test(derniere)) { prise.destroy(); return reject(new Error('SMTP : ' + derniere)); }
      if (/^220/.test(derniere) && etape > 1) {
        /* Réponse au STARTTLS : on rebascule la connexion en chiffré. */
        prise = tls.connect({ socket: prise, servername: hote }, () => {
          prise.write('EHLO plateforme-prevention\r\n');
        });
        prise.on('data', (x) => { tampon += x.toString(); });
        prise.on('error', reject);
        return;
      }
      avancer();
    });
    if (port === 465) prise.on('secureConnect', () => {});
  });
}

module.exports = { envoyer, verifierContenu, transportChoisi, INTERDITS };

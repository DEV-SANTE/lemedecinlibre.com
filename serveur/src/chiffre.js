/* =====================================================================
   CHIFFREMENT DE COLONNES
   ---------------------------------------------------------------------
   AES-256-GCM, du module crypto de Node. Sert aux données qui doivent
   rester illisibles même pour quelqu'un qui obtiendrait une copie de la
   base : le numéro de sécurité sociale en premier lieu.

   POURQUOI EN PLUS DU CHIFFREMENT DE DISQUE
   Le chiffrement de disque d'AZNETWORK protège contre le vol du matériel.
   Il ne protège pas contre une copie de sauvegarde égarée, un export mal
   configuré, ni contre un accès en lecture à la base — trois cas bien
   plus probables que le vol d'un serveur dans un datacenter.

   LA CLÉ N'EST PAS DANS LA BASE
   Elle vient de la variable d'environnement CLE_CHIFFREMENT. Une clé
   rangée à côté des données qu'elle protège ne protège rien.

   AUCUN REPLI EN CLAIR
   Si la clé est absente ou mal formée, chiffrer LÈVE UNE ERREUR. Le
   dossier n'est pas enregistré. C'est délibéré : un repli silencieux qui
   écrirait le numéro en clair serait la pire issue possible, puisqu'elle
   passerait inaperçue jusqu'au jour de la fuite.

   FORMAT STOCKÉ : v1.<sel aléatoire>.<étiquette>.<contenu>, en base64.
   Le préfixe de version permettra de changer d'algorithme sans avoir à
   devoir deviner comment une ancienne valeur a été produite.
   ===================================================================== */
'use strict';
const crypto = require('node:crypto');

const ALGO = 'aes-256-gcm';
const VERSION = 'v1';

function cle() {
  const brut = process.env.CLE_CHIFFREMENT;
  if (!brut) {
    throw new Error('CLE_CHIFFREMENT absente : impossible de chiffrer. '
      + 'Aucune donnée sensible ne sera enregistrée en clair.');
  }
  /* 32 octets attendus, fournis en hexadécimal ou en base64. */
  let k;
  if (/^[0-9a-f]{64}$/i.test(brut)) k = Buffer.from(brut, 'hex');
  else k = Buffer.from(brut, 'base64');
  if (k.length !== 32) {
    throw new Error('CLE_CHIFFREMENT invalide : 32 octets attendus (64 caractères '
      + 'hexadécimaux, ou base64), reçu ' + k.length + ' octet(s).');
  }
  return k;
}

function chiffrer(texteClair) {
  if (texteClair === null || texteClair === undefined || texteClair === '') return null;
  const k = cle();                       /* lève si absente : voulu */
  const sel = crypto.randomBytes(12);    /* GCM : 96 bits recommandés */
  const c = crypto.createCipheriv(ALGO, k, sel);
  const contenu = Buffer.concat([c.update(String(texteClair), 'utf8'), c.final()]);
  const etiquette = c.getAuthTag();
  return [VERSION, sel.toString('base64'), etiquette.toString('base64'),
          contenu.toString('base64')].join('.');
}

function dechiffrer(stocke) {
  if (!stocke) return null;
  const parts = String(stocke).split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Valeur chiffrée illisible : format inattendu.');
  }
  const k = cle();
  const d = crypto.createDecipheriv(ALGO, k, Buffer.from(parts[1], 'base64'));
  d.setAuthTag(Buffer.from(parts[2], 'base64'));
  /* Si la valeur a été modifiée en base, final() lève : l'étiquette
     d'authentification de GCM détecte l'altération. On préfère une erreur
     à une valeur silencieusement fausse. */
  return Buffer.concat([d.update(Buffer.from(parts[3], 'base64')), d.final()]).toString('utf8');
}

/* Empreinte déterministe, pour pouvoir RECHERCHER sans déchiffrer toute la
   table. Le chiffrement GCM produit un résultat différent à chaque appel —
   c'est ce qui le rend sûr, mais aussi impossible à interroger.
   L'empreinte est salée par la clé, donc inutilisable sans elle. */
function empreinte(texteClair) {
  if (!texteClair) return null;
  return crypto.createHmac('sha256', cle())
    .update(String(texteClair).replace(/\s/g, ''))
    .digest('hex');
}

/* Contrôle de format du numéro de sécurité sociale, avec sa clé de
   contrôle. Refuser une saisie erronée à l'entrée évite un dossier
   inexploitable en facturation. */
function nirValide(nir) {
  const propre = String(nir || '').toUpperCase().replace(/\s/g, '');
  if (!/^[12][0-9]{2}(0[1-9]|1[0-2]|20|[3-9][0-9])[0-9A-Z]{2}[0-9]{3}[0-9]{3}[0-9]{2}$/
      .test(propre)) return false;
  /* Corse : 2A et 2B deviennent 19 et 18 pour le calcul. */
  const pourCalcul = propre.slice(0, 15)
    .replace('2A', '19').replace('2B', '18');
  const corps = pourCalcul.slice(0, 13);
  const cleLue = Number(pourCalcul.slice(13, 15));
  if (!/^[0-9]{13}$/.test(corps)) return false;
  return cleLue === 97 - (Number(corps) % 97);
}

function genererCle() {
  return crypto.randomBytes(32).toString('hex');
}

/* =====================================================================
   ROTATION DE LA CLÉ
   ---------------------------------------------------------------------
   Changer de clé oblige à relire chaque valeur avec l'ancienne et à la
   réécrire avec la nouvelle. Il n'y a pas de raccourci : c'est le prix du
   chiffrement par colonne, et c'est pourquoi une rotation se prépare.

   CE QU'IL FAUT SAVOIR AVANT, ET QUI EST PLUS IMPORTANT QUE CE CODE

   La clé n'est nulle part ailleurs que dans CLE_CHIFFREMENT. Si elle est
   perdue, aucune valeur n'est récupérable — ni par nous, ni par
   l'hébergeur, ni par personne. Il faut donc :

     1. la conserver dans un coffre à secrets, hors du serveur et hors du
        dépôt de code ;
     2. en garder une copie de recouvrement chez une deuxième personne,
        sous scellé ;
     3. NE PAS la mettre dans la sauvegarde de la base — une sauvegarde
        qui contient à la fois les données et leur clé n'est pas chiffrée,
        elle est seulement compliquée.

   Ces trois points relèvent d'une procédure écrite, pas de ce fichier.
   Le mentionner ici est le maximum que le code puisse faire.

   La rotation appelle deux fonctions passées par l'appelant, qui sait
   comment lire et écrire ses propres tables. Ce module ne connaît pas le
   schéma, et n'a pas à le connaître.
   ===================================================================== */
async function rotation({ ancienneCle, nouvelleCle, lire, ecrire }) {
  if (!ancienneCle || !nouvelleCle) throw new Error('deux clés sont nécessaires');
  if (ancienneCle === nouvelleCle) throw new Error('la nouvelle clé est identique à l’ancienne');

  const enregistrer = process.env.CLE_CHIFFREMENT;
  let traitees = 0;
  try {
    const lignes = await lire();
    for (const ligne of lignes) {
      process.env.CLE_CHIFFREMENT = ancienneCle;
      const clair = dechiffrer(ligne.valeurChiffree);
      process.env.CLE_CHIFFREMENT = nouvelleCle;
      await ecrire(ligne.id, chiffrer(clair), empreinte(clair));
      traitees++;
    }
  } finally {
    /* On restaure la variable d'environnement quoi qu'il arrive : une
       rotation interrompue ne doit pas laisser le serveur avec une clé
       partielle en mémoire. */
    if (enregistrer === undefined) delete process.env.CLE_CHIFFREMENT;
    else process.env.CLE_CHIFFREMENT = enregistrer;
  }
  return { traitees };
}

module.exports = { chiffrer, dechiffrer, empreinte, nirValide, genererCle, rotation, VERSION };

/* =====================================================================
   NAVIGATION PARTAGÉE
   Un seul fichier, chargé par les sept pages.

   Il injecte une barre supérieure de circulation au-dessus de l'en-tête
   propre à chaque page. Deux niveaux, comme dans un vrai produit :
     - la barre de circulation, identique partout, pour passer d'un
       espace à l'autre ;
     - l'en-tête de la page, qui garde son identité.

   Aucune ressource externe, aucun cookie. Les styles sont injectés par
   ce fichier pour ne pas avoir à modifier sept feuilles de style.

   Les chemins sont résolus à l'exécution : le module retrouve la racine
   « /prevention-sante/ » dans l'URL courante et en déduit le préfixe,
   ce qui le rend indifférent à la profondeur du dossier.
   ===================================================================== */

(function () {
  'use strict';

  const RACINE = 'prevention-sante';

  /* Préfixe relatif vers la racine du site, quelle que soit la page. */
  function base() {
    const parts = location.pathname.split('/').filter(Boolean);
    const i = parts.lastIndexOf(RACINE);
    if (i === -1) return './';
    /* Nombre de segments après la racine, en ignorant un fichier final. */
    let apres = parts.length - 1 - i;
    const dernier = parts[parts.length - 1] || '';
    if (dernier.indexOf('.') !== -1) apres -= 1;   /* le dernier est un fichier */
    if (apres <= 0) return './';
    return new Array(apres + 1).join('../');
  }

  const B = base();

  const GROUPES = [
    {
      titre: 'Public',
      liens: [
        { id: 'accueil',  nom: 'Présentation', href: '',          desc: 'Page destinée aux employeurs' },
        { id: 'contenus', nom: 'Repères',      href: 'contenus/', desc: 'Contenus de prévention' }
      ]
    },
    {
      titre: 'Espace patient',
      liens: [
        { id: 'espace', nom: 'Mon espace', href: 'espace/', desc: 'Inscription, formule, questionnaire' },
        { id: 'suivi',  nom: 'Mon suivi',  href: 'suivi/',  desc: 'Résultats et parcours' }
      ]
    },
    {
      titre: 'Professionnel',
      liens: [
        { id: 'plateforme', nom: 'Vue médecin', href: 'plateforme/', desc: 'Dossiers, biologie, décision' },
        { id: 'entreprise', nom: 'Entreprise',  href: 'entreprise/', desc: 'Restitution agrégée' },
        { id: 'pilotage',   nom: 'Pilotage',    href: 'pilotage/',   desc: 'Contrôle interne' }
      ]
    }
  ];

  /* Page courante, déduite du chemin. */
  function courante() {
    const p = location.pathname;
    const seg = ['contenus', 'espace', 'suivi', 'plateforme', 'entreprise', 'pilotage'];
    for (const s of seg) {
      if (p.indexOf('/' + s + '/') !== -1 || p.indexOf('/' + s) === p.length - s.length - 1) return s;
    }
    return 'accueil';
  }

  const CSS = `
  .nvx{position:relative;z-index:70;background:#08181f;color:#a8c0c9;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    font-size:13.5px;line-height:1.4;border-bottom:1px solid rgba(255,255,255,.09)}
  .nvx-in{max-width:1180px;margin:0 auto;padding:0 26px;display:flex;align-items:center;
    gap:10px;min-height:46px;flex-wrap:wrap}
  .nvx-m{display:inline-flex;align-items:center;gap:9px;color:#fff;text-decoration:none;
    font-weight:700;letter-spacing:-.02em;font-size:13.5px;padding:6px 0;flex:0 0 auto}
  .nvx-m svg{width:20px;height:20px;flex:0 0 20px}
  .nvx-m span{opacity:.55;font-weight:500;letter-spacing:.06em;text-transform:uppercase;font-size:10px}
  .nvx-nav{display:flex;align-items:center;gap:2px;flex-wrap:wrap;margin-left:8px}
  .nvx-g{display:flex;align-items:center;gap:2px}
  .nvx-g+.nvx-g{margin-left:6px;padding-left:10px;border-left:1px solid rgba(255,255,255,.13)}
  .nvx-g>b{font-size:9.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;
    color:rgba(255,255,255,.32);margin-right:5px;white-space:nowrap}
  .nvx-a{color:#c6dae1;text-decoration:none;padding:6px 10px;border-radius:7px;white-space:nowrap;
    font-weight:520}
  .nvx-a:hover{background:rgba(255,255,255,.09);color:#fff}
  .nvx-a.on{background:#0f5f6b;color:#fff;font-weight:660}
  .nvx-env{margin-left:auto;font-family:ui-monospace,Menlo,monospace;font-size:10px;
    letter-spacing:.1em;text-transform:uppercase;color:#e0b57a;
    border:1px solid rgba(224,181,122,.35);padding:4px 9px;border-radius:999px;white-space:nowrap}
  .nvx-b{display:none;margin-left:auto;background:none;border:1px solid rgba(255,255,255,.2);
    color:#c6dae1;border-radius:7px;padding:5px 11px;font:inherit;font-size:12.5px;cursor:pointer}
  @media(max-width:960px){
    .nvx-nav{display:none;width:100%;flex-direction:column;align-items:stretch;gap:0;
      margin:0 0 10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.1)}
    .nvx-nav.ouvert{display:flex}
    .nvx-g{flex-direction:column;align-items:stretch;gap:0}
    .nvx-g+.nvx-g{margin:8px 0 0;padding:8px 0 0;border-left:none;
      border-top:1px solid rgba(255,255,255,.09)}
    .nvx-g>b{margin:6px 0 4px;padding:0 10px}
    .nvx-a{padding:9px 10px}
    .nvx-b{display:inline-block}
    .nvx-env{display:none}
  }`;

  /* La marque vient du fichier partagé. Cette copie-ci était restée au
     bleu-vert de l'ancienne charte alors que les six pages étaient déjà
     passées au bleu : la barre de circulation, visible sur toutes les
     pages, affichait donc un logo d'une autre couleur que celui de la
     page en dessous. C'est l'exemple exact de ce que la duplication
     produit, et personne ne l'avait signalé. */
  const LOGO = '<img src="' + B + 'commun/marque.svg" width="40" height="40" alt="">';

  function html() {
    const cur = courante();
    const nav = GROUPES.map(g =>
      '<span class="nvx-g"><b>' + g.titre + '</b>' +
      g.liens.map(l =>
        '<a class="nvx-a' + (l.id === cur ? ' on' : '') + '" href="' + B + l.href + '"' +
        ' title="' + l.desc + '"' + (l.id === cur ? ' aria-current="page"' : '') + '>' +
        l.nom + '</a>').join('') +
      '</span>').join('');

    return '<div class="nvx"><div class="nvx-in">' +
      '<a class="nvx-m" href="' + B + '">' + LOGO +
      '<span style="display:block">Prévention Santé<span style="display:block">Maquette</span></span></a>' +
      '<button class="nvx-b" id="nvx-b" aria-expanded="false">Pages</button>' +
      '<nav class="nvx-nav" id="nvx-nav" aria-label="Circulation entre les espaces">' + nav + '</nav>' +
      '<span class="nvx-env">Environnement de test</span>' +
      '</div></div>';
  }

  function poser() {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);

    const d = document.createElement('div');
    d.innerHTML = html();
    document.body.insertBefore(d.firstChild, document.body.firstChild);

    const b = document.getElementById('nvx-b');
    const n = document.getElementById('nvx-nav');
    if (b && n) b.onclick = () => {
      const o = n.classList.toggle('ouvert');
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', poser);
  } else {
    poser();
  }
})();

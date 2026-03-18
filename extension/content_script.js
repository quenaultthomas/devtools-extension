// DevTools Extension — Content Script
// Ce script est injecté dans la page active via chrome.scripting.executeScript()
// Il reçoit des instructions via window.__devtools_cmd avant injection.

(() => {
  const cmd = window.__devtools_cmd;
  if (!cmd) return;

  // ── EXTRACTION ────────────────────────────────────────────────────
  if (cmd.action === 'extract') {
    const inputs = document.querySelectorAll('input, textarea, select');
    if (!inputs.length) {
      window.__devtools_result = { ok: false, message: 'Aucun champ trouvé sur cette page.' };
      return;
    }

    const déjàVus = new Set();
    const lignes  = [];

    const nettoyer = (val) => {
      if (!val) return '';
      return val
        .replace(/\r?\n|\r/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/"/g, '\\"')
        .replace(/\s+/g, ' ')
        .trim();
    };

    [...inputs].forEach(el => {
      const id   = el.getAttribute('id');
      const name = el.getAttribute('name');
      if (!id && !name) return;
      const clé = id || name;
      if (déjàVus.has(clé)) return;
      déjàVus.add(clé);
      const sélecteur = id ? `#${id}` : `[name="${name}"]`;
      const type = el.getAttribute('type');
      try {
        if (type === 'radio') {
          const groupe  = name ? [...document.querySelectorAll(`input[name="${name}"]`)] : [el];
          const coché   = groupe.find(r => r.checked);
          const valeurs = groupe.map(r => r.value).join(' | ');
          const valeur  = coché ? `"${nettoyer(coché.value)}"` : 'null';
          lignes.push(`  '${sélecteur}': ${valeur}, // options : ${valeurs}`);
        } else if (type === 'checkbox') {
          lignes.push(`  '${sélecteur}': ${el.checked}, // true ou false`);
        } else if (el.tagName === 'SELECT') {
          const options      = [...el.options].map(o => o.value).filter(v => v).join(' | ');
          const valeurPropre = nettoyer(el.value);
          const valeur       = valeurPropre ? `"${valeurPropre}"` : 'null';
          lignes.push(`  '${sélecteur}': ${valeur}, // options : ${options}`);
        } else {
          const valeurPropre = nettoyer(el.value);
          const valeur       = valeurPropre ? `"${valeurPropre}"` : 'null';
          lignes.push(`  '${sélecteur}': ${valeur},`);
        }
      } catch(e) {
        lignes.push(`  // ⚠️ Erreur sur ${sélecteur} : ${e.message}`);
      }
    });

    const donnees = `{\n${lignes.join('\n')}\n}`;
    window.__devtools_result = { ok: true, count: lignes.length, donnees };
    return;
  }

  // ── REMPLISSAGE ───────────────────────────────────────────────────
  if (cmd.action === 'fill') {
    let données;
    try {
      données = cmd.donnees; // objet JS passé directement
    } catch(e) {
      window.__devtools_result = { ok: false, message: 'Données invalides : ' + e.message };
      return;
    }

    const nativeInputSetter    = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,    'value')?.set;
    const nativeCheckedSetter  = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,    'checked')?.set;
    const nativeSelectSetter   = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,   'value')?.set;
    const nativeTextareaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

    const normaliser = (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'boolean') return val;
      return String(val).replace(/[\r\n\t]/g, ' ').trim();
    };

    const résoudre = (selecteur) => {
      if (selecteur.startsWith('#')) {
        const id = selecteur.slice(1).replace(/\\/g, '');
        return document.getElementById(id);
      }
      try { return document.querySelector(selecteur); } catch(e) { return null; }
    };

    let remplis = 0;
    const ignorés = [];
    const introuvables = [];
    const erreurs = [];

    Object.entries(données).forEach(([selecteur, valeurBrute]) => {
      const valeur = normaliser(valeurBrute);
      if (valeur === null || valeur === '') { ignorés.push(selecteur); return; }
      const el = résoudre(selecteur);
      if (!el) { introuvables.push(selecteur); return; }
      const type = el.getAttribute('type');
      try {
        if (type === 'radio') {
          const cible = document.querySelector(`input[name="${el.name}"][value="${valeur}"]`);
          if (!cible) { introuvables.push(`${selecteur}[value="${valeur}"]`); return; }
          nativeCheckedSetter.call(cible, true);
          cible.dispatchEvent(new Event('click',  { bubbles: true }));
          cible.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (type === 'checkbox') {
          nativeCheckedSetter.call(el, valeur === true || valeur === 'true');
          el.dispatchEvent(new Event('click',  { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.tagName === 'SELECT') {
          nativeSelectSetter.call(el, valeur);
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.tagName === 'TEXTAREA') {
          nativeTextareaSetter.call(el, valeur);
          el.dispatchEvent(new Event('input',  { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          nativeInputSetter.call(el, valeur);
          el.dispatchEvent(new Event('input',  { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        remplis++;
      } catch(e) {
        erreurs.push(`${selecteur} : ${e.message}`);
      }
    });

    window.__devtools_result = { ok: true, remplis, ignorés, introuvables, erreurs };
  }
})();

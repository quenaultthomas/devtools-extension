
// Navigation
const tools = {
  json:      { title: 'JSON Formatter',  desc: 'Formater, indenter et minifier du JSON' },
  xml:       { title: 'XML Formatter',   desc: 'Formater, indenter et minifier du XML' },
  sql:       { title: 'SQL Formatter',   desc: 'Formater et indenter des requêtes SQL' },
  base64:    { title: 'Base64',           desc: 'Encoder et décoder en Base64' },
  jwt:       { title: 'JWT Decoder',      desc: 'Décoder et inspecter les tokens JWT' },
  timestamp: { title: 'Timestamp',        desc: 'Convertir timestamps Unix ↔ dates lisibles' },
  diff:      { title: 'Diff texte',       desc: 'Comparer deux blocs de texte ligne par ligne' },
  uuid:      { title: 'UUID Generator',   desc: 'Générer des UUID v4 aléatoires' },
  formtools: { title: 'Form Tools',        desc: 'Extraire les champs d\'un formulaire et générer un script de remplissage' },
};

function go(id) {
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  document.querySelector(`[onclick="go('${id}')"]`).classList.add('active');
  document.getElementById('tool-title').textContent = tools[id].title;
  document.getElementById('tool-desc').textContent = tools[id].desc;
  if (id === 'formtools') {
    document.getElementById('ft-extract-out').textContent = SCRIPT_EXTRACT;
  }
}

// ── JSON FORMATTER ────────────────────────────────────────────────
function jsonIndent() {
  const v = document.getElementById('json-indent').value;
  return v === 'tab' ? '\t' : parseInt(v);
}
function jsonFormat() {
  const raw = document.getElementById('json-in').value.trim();
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const out = JSON.stringify(parsed, null, jsonIndent());
    document.getElementById('json-out').textContent = out;
    setStatus('json-status-in', '✓ Valide', 'ok');
    setStatus('json-status-out', out.length + ' caractères', 'info');
  } catch(e) {
    setStatus('json-status-in', '✗ ' + e.message, 'err');
    document.getElementById('json-out').textContent = '';
  }
}
function jsonMinify() {
  const raw = document.getElementById('json-in').value.trim();
  if (!raw) return;
  try {
    const out = JSON.stringify(JSON.parse(raw));
    document.getElementById('json-out').textContent = out;
    setStatus('json-status-in', '✓ Valide', 'ok');
    setStatus('json-status-out', out.length + ' caractères', 'info');
  } catch(e) {
    setStatus('json-status-in', '✗ ' + e.message, 'err');
  }
}
function jsonValidate() {
  const raw = document.getElementById('json-in').value.trim();
  if (!raw) { setStatus('json-status-in', '', ''); return; }
  try { JSON.parse(raw); setStatus('json-status-in', '✓ JSON valide', 'ok'); }
  catch(e) { setStatus('json-status-in', '✗ ' + e.message, 'err'); }
}
function jsonClear() {
  document.getElementById('json-in').value = '';
  document.getElementById('json-out').textContent = '';
  setStatus('json-status-in', '', ''); setStatus('json-status-out', '', '');
}
async function jsonPaste() {
  try { document.getElementById('json-in').value = await navigator.clipboard.readText(); jsonValidate(); } catch(e){}
}
function jsonCopy() {
  const t = document.getElementById('json-out').textContent;
  if (t) navigator.clipboard.writeText(t).then(() => { setStatus('json-status-out', '✓ Copié !', 'ok'); setTimeout(() => setStatus('json-status-out', '', ''), 1500); });
}

// ── BASE64 ────────────────────────────────────────────────────────
function b64Encode() {
  const raw = document.getElementById('b64-raw').value;
  try {
    document.getElementById('b64-enc').value = btoa(unescape(encodeURIComponent(raw)));
    setStatus('b64-status', '✓ Encodé', 'ok');
  } catch(e) { setStatus('b64-status', '✗ ' + e.message, 'err'); }
}
function b64Decode() {
  const enc = document.getElementById('b64-enc').value.trim();
  try {
    document.getElementById('b64-raw').value = decodeURIComponent(escape(atob(enc)));
    setStatus('b64-status', '✓ Décodé', 'ok');
  } catch(e) { setStatus('b64-status', '✗ Base64 invalide', 'err'); }
}
function b64Clear() {
  document.getElementById('b64-raw').value = '';
  document.getElementById('b64-enc').value = '';
  setStatus('b64-status', '', '');
}
async function b64PasteA() { try { document.getElementById('b64-raw').value = await navigator.clipboard.readText(); } catch(e){} }
function b64CopyB() { navigator.clipboard.writeText(document.getElementById('b64-enc').value); }

// ── JWT ───────────────────────────────────────────────────────────
function jwtDecode() {
  const token = document.getElementById('jwt-in').value.trim();
  const out = document.getElementById('jwt-out');
  if (!token) { out.style.display = 'none'; setStatus('jwt-status', '', ''); return; }
  const parts = token.split('.');
  if (parts.length !== 3) { setStatus('jwt-status', '✗ Format invalide (attendu 3 parties)', 'err'); out.style.display = 'none'; return; }
  try {
    const decode = str => {
      const p = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = p + '=='.slice(0, (4 - p.length % 4) % 4);
      return JSON.parse(decodeURIComponent(escape(atob(pad))));
    };
    const header = decode(parts[0]);
    const payload = decode(parts[1]);
    document.getElementById('jwt-header').textContent = JSON.stringify(header, null, 2);
    document.getElementById('jwt-payload').textContent = JSON.stringify(payload, null, 2);
    document.getElementById('jwt-sig').textContent = parts[2];
    out.style.display = 'flex';

    // Expiry check
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      if (expDate < now) setStatus('jwt-status', '⚠ Token expiré le ' + expDate.toLocaleString('fr-FR'), 'err');
      else setStatus('jwt-status', '✓ Valide · expire le ' + expDate.toLocaleString('fr-FR'), 'ok');
    } else {
      setStatus('jwt-status', '✓ Décodé (pas d\'expiration)', 'ok');
    }
  } catch(e) { setStatus('jwt-status', '✗ Erreur de décodage : ' + e.message, 'err'); out.style.display = 'none'; }
}

// ── TIMESTAMP ─────────────────────────────────────────────────────
function tsRender(d) {
  if (isNaN(d.getTime())) return;
  const cards = document.getElementById('ts-cards');
  cards.style.display = 'grid';
  document.getElementById('ts-r-sec').textContent = Math.floor(d.getTime() / 1000);
  document.getElementById('ts-r-ms').textContent = d.getTime();
  document.getElementById('ts-r-utc').textContent = d.toUTCString();
  document.getElementById('ts-r-local').textContent = d.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  document.getElementById('ts-r-iso').textContent = d.toISOString();
  document.getElementById('ts-r-rel').textContent = tsRelative(d);
}
function tsRelative(d) {
  const diff = Date.now() - d.getTime();
  const abs = Math.abs(diff);
  const s = Math.floor(abs / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), day = Math.floor(h / 24);
  const past = diff > 0;
  if (day > 0) return (past ? 'Il y a ' : 'Dans ') + day + ' jour' + (day > 1 ? 's' : '');
  if (h > 0) return (past ? 'Il y a ' : 'Dans ') + h + 'h';
  if (m > 0) return (past ? 'Il y a ' : 'Dans ') + m + ' min';
  return (past ? 'Il y a ' : 'Dans ') + s + 's';
}
function tsFromUnix() {
  const v = document.getElementById('ts-unix').value.trim();
  if (!v) { document.getElementById('ts-cards').style.display = 'none'; setStatus('ts-status-unix', '', ''); return; }
  let ms = parseInt(v);
  if (isNaN(ms)) { setStatus('ts-status-unix', '✗ Valeur invalide', 'err'); return; }
  if (ms < 1e12) ms *= 1000; // secondes → ms
  const d = new Date(ms);
  document.getElementById('ts-date').value = d.toISOString().slice(0, 19).replace('T', ' ');
  setStatus('ts-status-unix', '✓', 'ok');
  tsRender(d);
}
function tsFromDate() {
  const v = document.getElementById('ts-date').value.trim();
  if (!v) { document.getElementById('ts-cards').style.display = 'none'; return; }
  const d = new Date(v);
  if (isNaN(d.getTime())) { setStatus('ts-status-date', '✗ Date invalide', 'err'); return; }
  document.getElementById('ts-unix').value = Math.floor(d.getTime() / 1000);
  setStatus('ts-status-date', '✓', 'ok');
  tsRender(d);
}
function tsNow() {
  const d = new Date();
  document.getElementById('ts-unix').value = Math.floor(d.getTime() / 1000);
  document.getElementById('ts-date').value = d.toISOString().slice(0, 19).replace('T', ' ');
  setStatus('ts-status-unix', '✓ Maintenant', 'ok');
  tsRender(d);
}
function tsClear() {
  document.getElementById('ts-unix').value = '';
  document.getElementById('ts-date').value = '';
  document.getElementById('ts-cards').style.display = 'none';
  setStatus('ts-status-unix', ''); setStatus('ts-status-date', '');
}

// ── DIFF ──────────────────────────────────────────────────────────
function doDiff() {
  const a = document.getElementById('diff-a').value.split('\n');
  const b = document.getElementById('diff-b').value.split('\n');
  const out = document.getElementById('diff-out');
  const result = lcs_diff(a, b);
  out.innerHTML = '';
  let adds = 0, dels = 0;
  result.forEach(([type, line]) => {
    const div = document.createElement('div');
    div.className = 'diff-line ' + (type === '+' ? 'diff-add' : type === '-' ? 'diff-del' : 'diff-ctx');
    div.textContent = (type === '+' ? '+ ' : type === '-' ? '- ' : '  ') + line;
    out.appendChild(div);
    if (type === '+') adds++;
    if (type === '-') dels++;
  });
  setStatus('diff-status', '+' + adds + ' / -' + dels + ' lignes', adds + dels > 0 ? 'info' : 'ok');
}
function lcs_diff(a, b) {
  // Simple LCS-based diff
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);
  const res = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { res.push(['=', a[i]]); i++; j++; }
    else if (dp[i+1][j] >= dp[i][j+1]) { res.push(['-', a[i]]); i++; }
    else { res.push(['+', b[j]]); j++; }
  }
  while (i < m) { res.push(['-', a[i]]); i++; }
  while (j < n) { res.push(['+', b[j]]); j++; }
  return res;
}
function diffClear() {
  document.getElementById('diff-a').value = '';
  document.getElementById('diff-b').value = '';
  document.getElementById('diff-out').innerHTML = '<span style="color:var(--text3);font-family:var(--mono);font-size:12px;padding:8px 10px;display:block">Aucun diff pour l\'instant…</span>';
  setStatus('diff-status', '', '');
}

// ── UUID ──────────────────────────────────────────────────────────
function uuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
function uuidGen(n) {
  const list = document.getElementById('uuid-list');
  for (let i = 0; i < n; i++) {
    const id = uuidV4();
    const row = document.createElement('div');
    row.className = 'uuid-row';
    row.innerHTML = `<span>${id}</span><button class="uuid-copy" onclick="uuidCopyOne(this, '${id}')">Copier</button>`;
    list.prepend(row);
  }
  const total = list.children.length;
  setStatus('uuid-status', total + ' UUID généré' + (total > 1 ? 's' : ''), 'ok');
}
function uuidCopyOne(btn, val) {
  navigator.clipboard.writeText(val).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => btn.textContent = orig, 1200);
  });
}
function uuidCopyAll() {
  const all = [...document.querySelectorAll('.uuid-row span')].map(s => s.textContent).join('\n');
  if (all) navigator.clipboard.writeText(all).then(() => setStatus('uuid-status', '✓ Tout copié !', 'ok'));
}
function uuidClear() {
  document.getElementById('uuid-list').innerHTML = '';
  setStatus('uuid-status', '', '');
}

// ── XML FORMATTER ─────────────────────────────────────────────────
function xmlGetIndent() {
  const v = document.getElementById('xml-indent').value;
  return v === 'tab' ? '\t' : ' '.repeat(parseInt(v));
}
function xmlFormatNode(node, indent, indentStr) {
  if (node.nodeType === 3) {
    const t = node.textContent.trim();
    return t ? indent + t : '';
  }
  if (node.nodeType === 8) return indent + '<!--' + node.textContent + '-->';
  if (node.nodeType !== 1) return '';
  const tag = node.tagName;
  let attrs = '';
  for (const a of node.attributes) attrs += ' ' + a.name + '="' + a.value + '"';
  const children = Array.from(node.childNodes);
  const textOnly = children.length === 1 && children[0].nodeType === 3 && children[0].textContent.trim();
  if (children.length === 0) return indent + '<' + tag + attrs + '/>';
  if (textOnly) return indent + '<' + tag + attrs + '>' + children[0].textContent.trim() + '</' + tag + '>';
  const inner = children.map(c => xmlFormatNode(c, indent + indentStr, indentStr)).filter(Boolean).join('\n');
  return indent + '<' + tag + attrs + '>\n' + inner + '\n' + indent + '</' + tag + '>';
}
function xmlFormat() {
  const raw = document.getElementById('xml-in').value.trim();
  if (!raw) return;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error(err.textContent.split('\n')[0].slice(0, 80));
    const indentStr = xmlGetIndent();
    const lines = [];
    if (doc.xmlVersion || raw.startsWith('<?xml')) lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    for (const child of doc.childNodes) {
      if (child.nodeType === 1) lines.push(xmlFormatNode(child, '', indentStr));
      else if (child.nodeType === 8) lines.push('<!--' + child.textContent + '-->');
    }
    const out = lines.join('\n');
    document.getElementById('xml-out').textContent = out;
    setStatus('xml-status-in', '✓ XML valide', 'ok');
    setStatus('xml-status-out', out.length + ' caractères', 'info');
  } catch(e) {
    setStatus('xml-status-in', '✗ ' + e.message, 'err');
    document.getElementById('xml-out').textContent = '';
  }
}
function xmlMinify() {
  const raw = document.getElementById('xml-in').value.trim();
  if (!raw) return;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('XML invalide');
    const s = new XMLSerializer();
    const out = s.serializeToString(doc).replace(/>\s+</g, '><').trim();
    document.getElementById('xml-out').textContent = out;
    setStatus('xml-status-in', '✓ XML valide', 'ok');
    setStatus('xml-status-out', out.length + ' caractères', 'info');
  } catch(e) { setStatus('xml-status-in', '✗ ' + e.message, 'err'); }
}
function xmlValidate() {
  const raw = document.getElementById('xml-in').value.trim();
  if (!raw) { setStatus('xml-status-in', '', ''); return; }
  try {
    const doc = new DOMParser().parseFromString(raw, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('XML invalide');
    setStatus('xml-status-in', '✓ XML valide', 'ok');
  } catch(e) { setStatus('xml-status-in', '✗ XML invalide', 'err'); }
}
function xmlClear() {
  document.getElementById('xml-in').value = '';
  document.getElementById('xml-out').textContent = '';
  setStatus('xml-status-in', '', ''); setStatus('xml-status-out', '', '');
}
async function xmlPaste() {
  try { document.getElementById('xml-in').value = await navigator.clipboard.readText(); xmlValidate(); } catch(e){}
}
function xmlCopy() {
  const t = document.getElementById('xml-out').textContent;
  if (t) navigator.clipboard.writeText(t).then(() => { setStatus('xml-status-out', '✓ Copié !', 'ok'); setTimeout(() => setStatus('xml-status-out', '', ''), 1500); });
}

// ── SQL FORMATTER ─────────────────────────────────────────────────
const SQL_KEYWORDS = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','FULL JOIN','CROSS JOIN','ON','AND','OR','NOT','IN','EXISTS','BETWEEN','LIKE','IS NULL','IS NOT NULL','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','UNION','UNION ALL','INTERSECT','EXCEPT','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','DISTINCT','AS','CASE','WHEN','THEN','ELSE','END','WITH','RETURNING'];
const SQL_KW_RE = new RegExp('\\b(' + SQL_KEYWORDS.map(k => k.replace(/ /g, '\\s+')).join('|') + ')\\b', 'gi');

function sqlFormat() {
  const raw = document.getElementById('sql-in').value.trim();
  if (!raw) return;
  try {
    const out = formatSQL(raw);
    document.getElementById('sql-out').textContent = out;
    setStatus('sql-status-in', '✓ Formaté', 'ok');
    setStatus('sql-status-out', out.split('\n').length + ' lignes', 'info');
  } catch(e) {
    setStatus('sql-status-in', '✗ ' + e.message, 'err');
  }
}

function formatSQL(sql) {
  // Normalize whitespace
  let s = sql.replace(/\s+/g, ' ').trim();

  // Uppercase keywords
  s = s.replace(SQL_KW_RE, m => m.toUpperCase().replace(/\s+/g, ' '));

  // Newline before main clauses
  const clauses = ['SELECT','FROM','WHERE','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','FULL JOIN','CROSS JOIN','JOIN','ON','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','UNION ALL','UNION','INTERSECT','EXCEPT','SET','VALUES','RETURNING'];
  for (const kw of clauses) {
    const re = new RegExp('\\s+' + kw.replace(/ /g, '\\s+') + '\\b', 'g');
    s = s.replace(re, '\n' + kw);
  }

  // Indent AND/OR inside WHERE/ON/HAVING
  s = s.replace(/\s+(AND|OR)\s+/g, '\n  $1 ');

  // Indent items after SELECT (split on top-level commas)
  s = indentSelectItems(s);

  // Indent VALUES rows
  s = s.replace(/VALUES\s*\(/g, 'VALUES\n  (');

  // Clean up leading/trailing spaces per line
  s = s.split('\n').map(l => l.trimEnd()).filter((l, i, a) => l || (a[i-1] && a[i-1].trim())).join('\n');

  return s.trim();
}

function indentSelectItems(sql) {
  return sql.replace(/^SELECT (.+?)(?=\nFROM|\nINTO|$)/ms, (match, cols) => {
    const items = splitTopLevel(cols);
    if (items.length <= 1) return match;
    return 'SELECT\n  ' + items.map(i => i.trim()).join(',\n  ');
  });
}

function splitTopLevel(str) {
  const parts = []; let depth = 0, cur = '';
  for (const ch of str) {
    if (ch === '(' ) depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function sqlMinify() {
  const raw = document.getElementById('sql-in').value.trim();
  if (!raw) return;
  const out = raw.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
  document.getElementById('sql-out').textContent = out;
  setStatus('sql-status-in', '✓ Minifié', 'ok');
  setStatus('sql-status-out', out.length + ' caractères', 'info');
}
function sqlValidate() {
  const raw = document.getElementById('sql-in').value.trim();
  if (!raw) { setStatus('sql-status-in', '', ''); return; }
  // Basic heuristic: starts with a known statement keyword
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|EXPLAIN)\b/i.test(raw))
    setStatus('sql-status-in', '✓ Semble valide', 'ok');
  else
    setStatus('sql-status-in', '⚠ Vérifiez la syntaxe', 'info');
}
function sqlClear() {
  document.getElementById('sql-in').value = '';
  document.getElementById('sql-out').textContent = '';
  setStatus('sql-status-in', '', ''); setStatus('sql-status-out', '', '');
}
async function sqlPaste() {
  try { document.getElementById('sql-in').value = await navigator.clipboard.readText(); sqlValidate(); } catch(e){}
}
function sqlCopy() {
  const t = document.getElementById('sql-out').textContent;
  if (t) navigator.clipboard.writeText(t).then(() => { setStatus('sql-status-out', '✓ Copié !', 'ok'); setTimeout(() => setStatus('sql-status-out', '', ''), 1500); });
}

// ── FORM TOOLS (Extension — chrome.scripting) ─────────────────────

function ftSwitch(tab) {
  document.getElementById('ft-extract').style.display = tab === 'extract' ? '' : 'none';
  document.getElementById('ft-fill').style.display    = tab === 'fill'    ? '' : 'none';
  document.getElementById('ftab-extract').style.borderBottomColor = tab === 'extract' ? 'var(--accent)' : 'transparent';
  document.getElementById('ftab-extract').style.color             = tab === 'extract' ? 'var(--accent)' : 'var(--text2)';
  document.getElementById('ftab-fill').style.borderBottomColor    = tab === 'fill'    ? 'var(--accent)' : 'transparent';
  document.getElementById('ftab-fill').style.color                = tab === 'fill'    ? 'var(--accent)' : 'var(--text2)';
}

// Injection de la logique d'extraction dans la page active
async function ftExtract() {
  setStatus('ft-extract-status', '⏳ Analyse en cours…', 'info');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Injecter le content script avec la commande extract
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => { window.__devtools_cmd = { action: 'extract' }; }
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content_script.js']
    });

    // Lire le résultat
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__devtools_result
    });

    const result = results?.[0]?.result;
    if (!result) throw new Error('Pas de résultat retourné — vérifiez les permissions.');
    if (!result.ok) throw new Error(result.message);

    // Afficher le bloc données
    const outEl = document.getElementById('ft-extract-out');
    outEl.textContent = result.donnees;
    setStatus('ft-extract-status', `✓ ${result.count} champ(s) extrait(s)`, 'ok');

    // Pré-remplir l'onglet remplissage
    document.getElementById('ft-donnees').value = result.donnees;

  } catch(e) {
    setStatus('ft-extract-status', '✗ ' + e.message, 'err');
    document.getElementById('ft-extract-out').textContent = 'Erreur : ' + e.message + '\n\nAssurez-vous que :\n- La page est bien chargée\n- L\'URL n\'est pas chrome:// ou une page interne\n- L\'extension a les permissions nécessaires';
  }
}

function ftCopyDonnees() {
  const t = document.getElementById('ft-extract-out').textContent;
  if (!t || t.startsWith('En attente') || t.startsWith('Erreur')) {
    setStatus('ft-extract-status', '✗ Rien à copier — lancez d\'abord une extraction', 'err');
    return;
  }
  navigator.clipboard.writeText(t).then(() => {
    setStatus('ft-extract-status', '✓ Copié !', 'ok');
    setTimeout(() => setStatus('ft-extract-status', '', ''), 1500);
  });
}

function ftClearExtract() {
  document.getElementById('ft-extract-out').textContent = 'En attente d\'extraction…';
  document.getElementById('ft-extract-out').style.color = 'var(--text2)';
  setStatus('ft-extract-status', '', '');
}

// Injection du remplissage dans la page active
async function ftFill() {
  const raw = document.getElementById('ft-donnees').value.trim();
  if (!raw) { setStatus('ft-fill-status', '✗ Le bloc données est vide', 'err'); return; }

  // Parser le bloc données (JSON5-like → on évalue prudemment)
  let donnees;
  try {
    // Nettoyer : supprimer commentaires de ligne, gérer trailing commas
    let cleaned = raw
      .replace(/\/\/[^\n]*/g, '')          // supprime commentaires //
      .replace(/,\s*([}\]])/g, '$1')       // trailing commas
      .replace(/'/g, '"');                 // guillemets simples → doubles
    // Extraire l'objet si entouré de {}
    if (!cleaned.trim().startsWith('{')) {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) cleaned = m[0];
    }
    donnees = JSON.parse(cleaned);
  } catch(e) {
    setStatus('ft-fill-status', '✗ Bloc données invalide : ' + e.message, 'err');
    return;
  }

  setStatus('ft-fill-status', '⏳ Remplissage en cours…', 'info');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Passer les données + commande fill
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (d) => { window.__devtools_cmd = { action: 'fill', donnees: d }; },
      args: [donnees]
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content_script.js']
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__devtools_result
    });

    const result = results?.[0]?.result;
    if (!result) throw new Error('Pas de résultat retourné.');
    if (!result.ok) throw new Error(result.message);

    // Rapport
    setStatus('ft-fill-status', `✓ ${result.remplis} champ(s) rempli(s)`, 'ok');
    const reportEl = document.getElementById('ft-fill-report');
    const reportOut = document.getElementById('ft-fill-report-out');
    reportEl.style.display = '';
    let rapport = `✅ Remplis    : ${result.remplis}`;
    if (result.ignorés?.length)      rapport += `\n⏭️  Ignorés    : ${result.ignorés.join(', ')}`;
    if (result.introuvables?.length) rapport += `\n⚠️  Introuvables: ${result.introuvables.join(', ')}`;
    if (result.erreurs?.length)      rapport += `\n✗  Erreurs    : ${result.erreurs.join(', ')}`;
    reportOut.textContent = rapport;

  } catch(e) {
    setStatus('ft-fill-status', '✗ ' + e.message, 'err');
  }
}

function ftClearFill() {
  document.getElementById('ft-donnees').value = '';
  document.getElementById('ft-fill-report').style.display = 'none';
  setStatus('ft-fill-status', '', '');
}

// ── Utils ─────────────────────────────────────────────────────────
  const inputs = document.querySelectorAll('input, textarea, select');
  if (!inputs.length) { console.warn('⚠️ Aucun champ trouvé sur cette page.'); return; }
  const déjàVus = new Set();
  const lignes  = [];
  const nettoyer = (val) => {
    if (!val) return '';
    return val.replace(/\\r?\\n|\\r/g, ' ').replace(/\\t/g, ' ').replace(/"/g, '\\\\"').replace(/\\s+/g, ' ').trim();
  };
  [...inputs].forEach(el => {
    const id   = el.getAttribute('id');
    const name = el.getAttribute('name');
    if (!id && !name) return;
    const clé = id || name;
    if (déjàVus.has(clé)) return;
    déjàVus.add(clé);
    const sélecteur = id ? \`#\${id}\` : \`[name="\${name}"]\`;
    const type = el.getAttribute('type');
    try {
      if (type === 'radio') {
        const groupe  = name ? [...document.querySelectorAll(\`input[name="\${name}"]\`)] : [el];
        const coché   = groupe.find(r => r.checked);
        const valeurs = groupe.map(r => r.value).join(' | ');
        const valeur  = coché ? \`"\${nettoyer(coché.value)}"\` : 'null';
        lignes.push(\`  '\${sélecteur}': \${valeur}, // options : \${valeurs}\`);
      } else if (type === 'checkbox') {
        lignes.push(\`  '\${sélecteur}': \${el.checked}, // true ou false\`);
      } else if (el.tagName === 'SELECT') {
        const options      = [...el.options].map(o => o.value).filter(v => v).join(' | ');
        const valeurPropre = nettoyer(el.value);
        const valeur       = valeurPropre ? \`"\${valeurPropre}"\` : 'null';
        lignes.push(\`  '\${sélecteur}': \${valeur}, // options : \${options}\`);
      } else {
        const valeurPropre = nettoyer(el.value);
        const valeur       = valeurPropre ? \`"\${valeurPropre}"\` : 'null';
        lignes.push(\`  '\${sélecteur}': \${valeur},\`);
      }
    } catch(e) { lignes.push(\`  // ⚠️ Erreur sur \${sélecteur} : \${e.message}\`); }
  });
  const output = \`const données = {\\n\${lignes.join('\\n')}\\n};\`;
  console.log(\`✅ \${lignes.length} champ(s) trouvé(s) :\\n\`);
  console.log(output);
  copy(output);
  console.log('\\n📋 Copié dans le presse-papier !');
})();`;

// ── Utils ─────────────────────────────────────────────────────────
function setStatus(id, msg, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'status ' + (cls || '');
}

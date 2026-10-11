// Construit riftbound.json : cartes Riftbound (Riftcodex) + prix Cardmarket (fichiers publics quotidiens).
// Lancé chaque nuit par .github/workflows/riftbound.yml — aucune clé nécessaire.
import { writeFileSync } from "node:fs";

const RC_API = "https://api.riftcodex.com";
const CM = "https://downloads.s3.cardmarket.com/productCatalog";
const CM_GAME = 22; // Riftbound sur Cardmarket

// Extensions Cardmarket correspondant à chaque extension Riftcodex (vérifié le 11.10.2026)
const EXP = {
  OGN: [6286], OGS: [6289], SFD: [6399], UNL: [6491, 6567], VEN: [6587, 6588],
  PR: [6322, 6483, 6480, 6681, 6705], OPP: [6322, 6483, 6480, 6681, 6705, 6567, 6588], JDG: [6322, 6483],
};
// Variantes : code court + ordre de prix attendu (de la moins chère à la plus chère)
const VARIANTS = {
  "": ["N", 0], "Starter": ["ST", 0], "Launch Exclusive": ["LX", 1], "Alternate Art": ["A", 2], "Metal": ["M", 3],
  "Overnumbered": ["O", 4], "Signature": ["SG", 5], "Ultimate": ["UL", 6], "GG EZ": ["GZ", 6],
};
const RAR = { Common: "c", Uncommon: "u", Rare: "r", Epic: "e", Showcase: "s", Promo: "p" };

export function norm(s) {
  return s.toLowerCase().replace(/\s*\([^)]*\)\s*$/, "").replace(/ - /g, ", ")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9, ']/g, "").replace(/\s+/g, " ").trim();
}
function variantOf(name) { const m = name.match(/\(([^)]+)\)\s*$/); const v = m ? m[1] : ""; return VARIANTS[v] || ["A", 2]; }
const r2 = (v) => (v == null ? 0 : Math.round(v * 100) / 100);

export function build(rcCards, rcSets, products, guides) {
  const price = new Map(guides.map((g) => [g.idProduct, g]));
  const cmIdx = new Map();
  for (const p of products) { const k = p.idExpansion + "|" + norm(p.name); if (!cmIdx.has(k)) cmIdx.set(k, []); cmIdx.get(k).push(p); }
  const trend = (p) => { const g = price.get(p.idProduct) || {}; return g.trend || g["trend-foil"] || g.avg || 0; };

  const groups = new Map();
  for (const c of rcCards) { const k = c.set.set_id + "|" + norm(c.name); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); }

  const used = new Set(), match = new Map(), approx = new Set();
  for (const [k, cards] of groups) {
    const [set, nm] = k.split("|");
    let cand = [];
    for (const e of EXP[set] || []) cand.push(...(cmIdx.get(e + "|" + nm) || []));
    cand = cand.filter((p) => !used.has(p.idProduct));
    if (!cand.length) continue;
    cand.sort((a, b) => trend(a) - trend(b));
    const cs = cards.slice().sort((a, b) => variantOf(a.name)[1] - variantOf(b.name)[1] || a.collector_number - b.collector_number);
    const exact = cand.length === cs.length;
    cs.forEach((c, i) => {
      const p = cand[Math.min(i, cand.length - 1)];
      if (cand.length >= cs.length) used.add(p.idProduct);
      match.set(c.id, p);
      if (!exact && cs.length > 1) approx.add(c.id);
    });
  }

  const cards = rcCards.map((c) => {
    const [v] = variantOf(c.name);
    const p = match.get(c.id), g = p ? price.get(p.idProduct) || {} : {};
    const eur = r2(g.trend ?? g.avg), eurf = r2(g["trend-foil"] ?? g["avg-foil"]);
    const cl = c.classification || {}, at = c.attributes || {};
    const fin = eur && eurf ? "nf" : eurf && !eur ? "f" : "nf";
    return {
      id: c.riftbound_id, set: c.set.set_id, cn: String(c.collector_number), name: c.name.replace(/\s*\([^)]*\)\s*$/, ""),
      v, r: RAR[cl.rarity] || "c", type: cl.type || "", sup: cl.supertype || "", dom: cl.domain || [],
      e: at.energy, m: at.might, p: at.power, text: (c.text && c.text.plain) || "", img: (c.media && c.media.image_url) || "",
      art: (c.media && c.media.artist) || "", tags: c.tags || [], land: c.orientation === "landscape" ? 1 : 0,
      fin, eur, eurf, cm: p ? p.idProduct : 0, ax: approx.has(c.id) ? 1 : 0,
    };
  });
  // Clé unique par impression (riftbound_id ne distingue pas toujours les variantes)
  const seen = new Set();
  for (const c of cards) {
    let k = c.id + (c.v !== "N" ? "~" + c.v.toLowerCase() : "");
    for (let n = 2; seen.has(k); n++) k = c.id + "~" + c.v.toLowerCase() + n;
    seen.add(k); c.k = k;
  }
  const sets = rcSets.map((s) => ({ id: s.set_id, name: s.name, count: s.card_count, date: (s.published_on || "").slice(0, 10) }));
  return { cards, sets, stats: { total: cards.length, priced: cards.filter((c) => c.cm).length } };
}

async function getJSON(url) {
  const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "HobbitDex/1.0 (GitHub Action)" } });
  if (!r.ok) throw new Error(url + " → HTTP " + r.status);
  return r.json();
}
async function main() {
  const rcCards = [];
  for (let page = 1; ; page++) {
    const j = await getJSON(`${RC_API}/cards?size=100&page=${page}`);
    rcCards.push(...j.items);
    if (page >= j.pages) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  const rcSets = (await getJSON(`${RC_API}/sets`)).items;
  const products = (await getJSON(`${CM}/productList/products_singles_${CM_GAME}.json`)).products;
  const guides = (await getJSON(`${CM}/priceGuide/price_guide_${CM_GAME}.json`)).priceGuides;
  const out = build(rcCards, rcSets, products, guides);
  if (out.cards.length < 500) throw new Error("Trop peu de cartes reçues (" + out.cards.length + "), fichier non remplacé.");
  writeFileSync("riftbound.json", JSON.stringify({ at: new Date().toISOString(), ...out }));
  console.log(`riftbound.json : ${out.stats.total} cartes, ${out.stats.priced} avec prix`);
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });

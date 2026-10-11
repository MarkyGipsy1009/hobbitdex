// Construit riftbound-prices.json : catalogue + prix Cardmarket pour Riftbound (fichiers publics quotidiens).
// Lancé chaque nuit par .github/workflows/riftbound.yml — aucune clé nécessaire.
// Les cartes elles-mêmes (Riftcodex) sont chargées directement par le site, car Riftcodex bloque les serveurs GitHub.
import { writeFileSync } from "node:fs";

const CM = "https://downloads.s3.cardmarket.com/productCatalog";
const CM_GAME = 22; // Riftbound sur Cardmarket
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

async function getJSON(url) {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
    if (r.ok) return r.json();
    if (attempt >= 3) throw new Error(url + " → HTTP " + r.status);
    await new Promise((res) => setTimeout(res, 2000 * attempt));
  }
}
const r2 = (v) => (v == null ? 0 : Math.round(v * 100) / 100);

async function main() {
  const products = (await getJSON(`${CM}/productList/products_singles_${CM_GAME}.json`)).products;
  const guides = (await getJSON(`${CM}/priceGuide/price_guide_${CM_GAME}.json`)).priceGuides;
  const price = new Map(guides.map((g) => [g.idProduct, g]));
  // [idProduct, nom, idExpansion, prix normal (trend), prix foil (trend)]
  const rows = products.map((p) => {
    const g = price.get(p.idProduct) || {};
    return [p.idProduct, p.name, p.idExpansion, r2(g.trend ?? g.avg), r2(g["trend-foil"] ?? g["avg-foil"])];
  });
  if (rows.length < 500) throw new Error("Trop peu de produits reçus (" + rows.length + "), fichier non remplacé.");
  writeFileSync("riftbound-prices.json", JSON.stringify({ at: new Date().toISOString(), products: rows }));
  console.log(`riftbound-prices.json : ${rows.length} produits, ${rows.filter((r) => r[3] || r[4]).length} avec prix`);
}
main().catch((e) => { console.error(e); process.exit(1); });

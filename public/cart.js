// Pure cart logic — no DOM, so it runs in the browser and in `node --test`.

export function createCart() {
  return new Map(); // itemId -> qty
}

export function add(cart, id, delta = 1) {
  const qty = Math.max(0, Math.min(50, (cart.get(id) ?? 0) + delta));
  if (qty === 0) cart.delete(id);
  else cart.set(id, qty);
  return cart;
}

export function indexItems(menu) {
  const byId = new Map();
  for (const cat of menu.categories) for (const item of cat.items) byId.set(item.id, item);
  return byId;
}

export function lines(cart, itemsById) {
  return [...cart].filter(([id]) => itemsById.has(id)).map(([id, qty]) => ({ item: itemsById.get(id), qty }));
}

export function total(cart, itemsById) {
  const cents = lines(cart, itemsById).reduce((sum, l) => sum + Math.round(l.item.price * 100) * l.qty, 0);
  return cents / 100;
}

export function count(cart) {
  let n = 0;
  for (const qty of cart.values()) n += qty;
  return n;
}

export const money = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

/** Build the order text that is sent to the restaurant on WhatsApp. */
export function orderMessage({ cart, itemsById, table, note, lang = "so", currency = "USD" }) {
  const L = lang === "so"
    ? { order: "Dalab cusub", table: "Miiska", note: "Fiiro gaar ah", total: "Wadarta" }
    : { order: "New order", table: "Table", note: "Note", total: "Total" };
  const rows = lines(cart, itemsById).map((l) => `• ${l.qty} × ${l.item.name[lang]} — ${money(l.item.price * l.qty, currency)}`);
  return [
    `🧾 *${L.order}*${table ? ` — ${L.table} ${table}` : ""}`,
    "",
    ...rows,
    "",
    `*${L.total}: ${money(total(cart, itemsById), currency)}*`,
    ...(note?.trim() ? ["", `📝 ${L.note}: ${note.trim()}`] : []),
  ].join("\n");
}

export function whatsappLink(phone, text) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Only accept short, safe table identifiers from the QR URL. */
export function parseTable(search) {
  const t = new URLSearchParams(search).get("table");
  return t && /^[A-Za-z0-9-]{1,8}$/.test(t) ? t : null;
}

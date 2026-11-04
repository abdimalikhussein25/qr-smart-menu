import { createCart, add, indexItems, lines, total, count, money, orderMessage, whatsappLink, parseTable } from "./cart.js";

const $ = (id) => document.getElementById(id);

const TEXT = {
  so: { view: "Eeg dalabka", yours: "Dalabkaaga", note: "Fiiro gaar ah (ikhtiyaari)", total: "Wadarta", send: "Ku dir WhatsApp", table: "Miiska", popular: "★ Caan", toggle: "EN" },
  en: { view: "View order", yours: "Your order", note: "Note (optional)", total: "Total", send: "Send on WhatsApp", table: "Table", popular: "★ Popular", toggle: "SO" },
};

let lang = (() => { try { return localStorage.getItem("lang") || "so"; } catch { return "so"; } })();
const cart = createCart();
const table = parseTable(location.search);
let menu, itemsById;

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

function renderMenu() {
  const t = TEXT[lang];
  const cur = menu.restaurant.currency;
  document.documentElement.lang = lang;
  $("name").textContent = menu.restaurant.name;
  $("tagline").textContent = menu.restaurant.tagline;
  document.title = `${menu.restaurant.name} — Menu`;
  $("lang").textContent = t.toggle;
  if (table) {
    $("table-badge").hidden = false;
    $("table-badge").textContent = `${t.table} ${table}`;
  }

  $("tabs").replaceChildren(
    ...menu.categories.map((c) => el("a", { href: `#${c.id}`, textContent: c.name[lang] })),
  );

  $("menu").replaceChildren(
    ...menu.categories.flatMap((c) => [
      el("h2", { id: c.id, textContent: c.name[lang] }),
      ...c.items.map((item) => {
        const qty = cart.get(item.id) ?? 0;
        const control = qty === 0
          ? el("button", { className: "add", type: "button", ariaLabel: `Add ${item.name[lang]}`, textContent: "+", onclick: () => change(item.id, 1) })
          : el("div", { className: "stepper" },
              el("button", { type: "button", ariaLabel: "Less", textContent: "−", onclick: () => change(item.id, -1) }),
              el("span", { textContent: qty }),
              el("button", { type: "button", ariaLabel: "More", textContent: "+", onclick: () => change(item.id, 1) }));
        return el("article", { className: "item" },
          el("div", { className: "emoji", textContent: item.emoji ?? "🍽️" }),
          el("div", {},
            el("h3", {}, item.name[lang], ...(item.popular ? [el("span", { className: "pop", textContent: t.popular })] : [])),
            el("div", { className: "price", textContent: money(item.price, cur) })),
          control);
      }),
    ]),
  );
  renderCart();
}

function renderCart() {
  const t = TEXT[lang];
  const cur = menu.restaurant.currency;
  const n = count(cart);
  $("cart-bar").hidden = n === 0;
  $("cart-count").textContent = n;
  $("cart-label").textContent = t.view;
  $("cart-total").textContent = money(total(cart, itemsById), cur);

  $("sheet-title").textContent = t.yours;
  $("note-label").textContent = t.note;
  $("total-label").textContent = t.total;
  $("send-label").textContent = t.send;
  $("sheet-total").textContent = money(total(cart, itemsById), cur);
  $("lines").replaceChildren(
    ...lines(cart, itemsById).map(({ item, qty }) =>
      el("li", {},
        el("span", { textContent: `${item.emoji ?? ""} ${item.name[lang]}` }),
        el("div", { className: "stepper" },
          el("button", { type: "button", textContent: "−", onclick: () => change(item.id, -1) }),
          el("span", { textContent: qty }),
          el("button", { type: "button", textContent: "+", onclick: () => change(item.id, 1) })))),
  );
  if (n === 0 && $("sheet").open) $("sheet").close();
}

function change(id, delta) {
  add(cart, id, delta);
  renderMenu();
}

function highlightTab() {
  const sections = [...document.querySelectorAll(".menu h2")];
  const current = sections.filter((h) => h.getBoundingClientRect().top < 120).pop() ?? sections[0];
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.hash === `#${current?.id}`));
}

$("lang").onclick = () => {
  lang = lang === "so" ? "en" : "so";
  try { localStorage.setItem("lang", lang); } catch {}
  renderMenu();
};
$("cart-bar").onclick = () => $("sheet").showModal();
$("send").onclick = () => {
  const text = orderMessage({ cart, itemsById, table, note: $("note").value, lang, currency: menu.restaurant.currency });
  window.open(whatsappLink(menu.restaurant.whatsapp, text), "_blank", "noopener");
};
addEventListener("scroll", highlightTab, { passive: true });

menu = await (await fetch("menu.json")).json();
itemsById = indexItems(menu);
renderMenu();
highlightTab();

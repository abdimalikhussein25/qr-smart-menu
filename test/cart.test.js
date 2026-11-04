import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCart, add, indexItems, total, count, orderMessage, whatsappLink, parseTable } from "../public/cart.js";

const menu = JSON.parse(readFileSync(new URL("../public/menu.json", import.meta.url)));
const items = indexItems(menu);

test("add, remove and cap quantities", () => {
  const cart = createCart();
  add(cart, "m1");
  add(cart, "m1");
  add(cart, "d1", 3);
  assert.equal(count(cart), 5);
  add(cart, "m1", -2);
  assert.equal(cart.has("m1"), false);
  add(cart, "s1", 999);
  assert.equal(cart.get("s1"), 50);
});

test("total avoids floating point drift", () => {
  const cart = createCart();
  add(cart, "d1", 3); // 3 × 0.75
  add(cart, "m1"); // 6.50
  assert.equal(total(cart, items), 8.75);
});

test("order message includes table, lines, total and note", () => {
  const cart = createCart();
  add(cart, "m1", 2);
  add(cart, "d2");
  const msg = orderMessage({ cart, itemsById: items, table: "7", note: "basbaas la'aan", lang: "so" });
  assert.match(msg, /Miiska 7/);
  assert.match(msg, /2 × Bariis iyo Hilib Ari — \$13\.00/);
  assert.match(msg, /Wadarta: \$15\.50/);
  assert.match(msg, /basbaas la'aan/);
});

test("english message", () => {
  const cart = add(createCart(), "s1");
  assert.match(orderMessage({ cart, itemsById: items, lang: "en" }), /New order[\s\S]*Sambusa \(4\)/);
});

test("whatsapp link is encoded", () => {
  assert.equal(whatsappLink("+252 61 000", "a b&c"), "https://wa.me/25261000?text=a%20b%26c");
});

test("table parameter is validated", () => {
  assert.equal(parseTable("?table=12"), "12");
  assert.equal(parseTable("?table=VIP-2"), "VIP-2");
  assert.equal(parseTable("?table=<script>"), null);
  assert.equal(parseTable(""), null);
});

test("menu items have unique ids and positive prices", () => {
  const all = menu.categories.flatMap((c) => c.items);
  assert.equal(new Set(all.map((i) => i.id)).size, all.length);
  for (const i of all) assert.ok(i.price > 0 && i.name.so && i.name.en, i.id);
});

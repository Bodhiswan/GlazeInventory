import assert from "node:assert/strict";
import test from "node:test";

import { layoutModeFromCookie, routeForLayout } from "../src/lib/layout-mode";

const id = "85d28058-0d12-4e99-97d1-03a9c0da447c";

test("new layout is the default; only the classic cookie opts out", () => {
  assert.equal(layoutModeFromCookie(undefined), "new");
  assert.equal(layoutModeFromCookie("new"), "new");
  assert.equal(layoutModeFromCookie("classic"), "classic");
});

test("new layout rewrites the shared public URLs", () => {
  for (const path of ["/glazes", `/glazes/${id}`, "/combinations", "/combinations/examples/abc", "/inventory", "/profile", "/contribute", "/studio/muddy-hands", "/studio/muddy-hands/library", "/studio/muddy-hands/combinations", "/studio/muddy-hands/join"]) {
    assert.deepEqual(routeForLayout(path, "new"), { type: "rewrite", pathname: `/n${path}` }, path);
  }
  assert.deepEqual(routeForLayout("/glazes/", "new"), { type: "rewrite", pathname: "/n/glazes" });
});

test("pages that stay classic in both layouts", () => {
  for (const path of ["/", "/glazes/request", "/combinations/abc--def", "/guides/glazing-pottery", "/auth/sign-in", "/admin/analytics", "/api/track-buy-click", "/contribute/welcome"]) {
    assert.equal(routeForLayout(path, "new"), null, path);
  }
});

test("folded pages redirect in the new layout", () => {
  assert.deepEqual(routeForLayout("/dashboard", "new"), { type: "redirect", pathname: "/inventory" });
  assert.deepEqual(routeForLayout("/community", "new"), { type: "redirect", pathname: "/combinations", search: "?v=potters" });
  assert.deepEqual(routeForLayout("/inventory/x/edit", "new"), { type: "redirect", pathname: "/inventory" });
});

test("classic mode leaves everything alone", () => {
  assert.equal(routeForLayout("/glazes", "classic"), null);
  assert.equal(routeForLayout("/dashboard", "classic"), null);
});

test("the internal /n tree is never public", () => {
  assert.deepEqual(routeForLayout("/n/glazes", "new"), { type: "redirect", pathname: "/glazes" });
  assert.deepEqual(routeForLayout("/n/glazes", "classic"), { type: "redirect", pathname: "/glazes" });
});

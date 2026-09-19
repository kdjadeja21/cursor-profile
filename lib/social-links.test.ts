import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSocialLink, parseSocialLinks } from "./social-links.ts";

describe("parseSocialLink", () => {
  it("reads X handles from x.com and twitter.com", () => {
    assert.deepEqual(parseSocialLink("https://x.com/poteto"), {
      href: "https://x.com/poteto",
      kind: "x",
      label: "@poteto",
    });

    assert.equal(parseSocialLink("https://twitter.com/poteto/").kind, "x");
    assert.equal(parseSocialLink("https://www.twitter.com/poteto").label, "@poteto");
    assert.equal(parseSocialLink("https://mobile.twitter.com/poteto").label, "@poteto");
    assert.equal(parseSocialLink("https://x.com").label, "X");
  });

  it("reads GitHub usernames from the first path segment", () => {
    assert.deepEqual(parseSocialLink("https://github.com/poteto"), {
      href: "https://github.com/poteto",
      kind: "github",
      label: "poteto",
    });

    assert.equal(parseSocialLink("https://www.github.com/poteto/").label, "poteto");
    assert.equal(parseSocialLink("https://github.com").label, "GitHub");
  });

  it("uses a globe label of the hostname for personal sites", () => {
    assert.deepEqual(parseSocialLink("https://www.no.lol/"), {
      href: "https://www.no.lol/",
      kind: "website",
      label: "no.lol",
    });

    assert.equal(parseSocialLink("https://leerob.com").label, "leerob.com");
  });

  it("falls back to the raw string when the URL is not parseable", () => {
    assert.deepEqual(parseSocialLink("not a url"), {
      href: "not a url",
      kind: "website",
      label: "not a url",
    });
  });

  it("recognizes X and GitHub when the profile omitted https://", () => {
    assert.deepEqual(parseSocialLink("x.com/ericzakariasson"), {
      href: "https://x.com/ericzakariasson",
      kind: "x",
      label: "@ericzakariasson",
    });

    assert.deepEqual(parseSocialLink("github.com/ericzakariasson"), {
      href: "https://github.com/ericzakariasson",
      kind: "github",
      label: "ericzakariasson",
    });

    assert.equal(parseSocialLink("//twitter.com/ericzakariasson").kind, "x");
    assert.equal(parseSocialLink("www.github.com/ericzakariasson").kind, "github");
  });
});

describe("parseSocialLinks", () => {
  it("keeps profile order", () => {
    const links = parseSocialLinks([
      "https://x.com/poteto",
      "https://github.com/poteto",
      "https://www.no.lol/",
    ]);

    assert.deepEqual(
      links.map((link) => [link.kind, link.label]),
      [
        ["x", "@poteto"],
        ["github", "poteto"],
        ["website", "no.lol"],
      ],
    );
  });
});

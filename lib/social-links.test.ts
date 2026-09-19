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

  it("reads LinkedIn profiles and company pages", () => {
    assert.deepEqual(parseSocialLink("https://www.linkedin.com/in/vishal-nai"), {
      href: "https://www.linkedin.com/in/vishal-nai",
      kind: "linkedin",
      label: "vishal-nai",
    });

    assert.equal(parseSocialLink("linkedin.com/in/vishal-nai").kind, "linkedin");
    assert.equal(parseSocialLink("https://uk.linkedin.com/in/vishal-nai").kind, "linkedin");
    assert.equal(parseSocialLink("https://www.linkedin.com/company/cursor").label, "cursor");
    assert.equal(parseSocialLink("https://linkedin.com").label, "LinkedIn");
    assert.equal(parseSocialLink("https://lnkd.in/abc123").kind, "linkedin");
  });

  it("reads Linktree handles from linktr.ee and linktree.com", () => {
    assert.deepEqual(parseSocialLink("https://linktr.ee/vishalnai"), {
      href: "https://linktr.ee/vishalnai",
      kind: "linktree",
      label: "vishalnai",
    });

    assert.equal(parseSocialLink("linktr.ee/vishalnai").kind, "linktree");
    assert.equal(parseSocialLink("https://www.linktree.com/vishalnai").label, "vishalnai");
    assert.equal(parseSocialLink("https://linktr.ee").label, "Linktree");
  });

  it("recognizes other well-known media hosts", () => {
    assert.equal(parseSocialLink("https://instagram.com/poteto").kind, "instagram");
    assert.equal(parseSocialLink("https://www.instagram.com/poteto").label, "@poteto");
    assert.equal(parseSocialLink("https://youtube.com/@poteto").kind, "youtube");
    assert.equal(parseSocialLink("https://www.youtube.com/@poteto").label, "@poteto");
    assert.equal(parseSocialLink("https://youtu.be/abc").kind, "youtube");
    assert.equal(parseSocialLink("https://www.tiktok.com/@poteto").kind, "tiktok");
    assert.equal(parseSocialLink("https://www.facebook.com/poteto").kind, "facebook");
    assert.equal(parseSocialLink("https://www.threads.net/@poteto").kind, "threads");
    assert.equal(parseSocialLink("https://bsky.app/profile/poteto.bsky.social").kind, "bluesky");
    assert.equal(parseSocialLink("https://bsky.app/profile/poteto.bsky.social").label, "poteto.bsky.social");
    assert.equal(parseSocialLink("https://discord.gg/cursor").kind, "discord");
    assert.equal(parseSocialLink("https://www.twitch.tv/poteto").kind, "twitch");
    assert.equal(parseSocialLink("https://www.reddit.com/u/poteto").kind, "reddit");
    assert.equal(parseSocialLink("https://medium.com/@poteto").kind, "medium");
    assert.equal(parseSocialLink("https://poteto.substack.com").kind, "substack");
    assert.equal(parseSocialLink("https://dribbble.com/poteto").kind, "dribbble");
    assert.equal(parseSocialLink("https://www.behance.net/poteto").kind, "behance");
    assert.equal(parseSocialLink("https://t.me/poteto").kind, "telegram");
    assert.equal(parseSocialLink("https://gitlab.com/poteto").kind, "gitlab");
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
      "https://www.linkedin.com/in/poteto",
      "https://linktr.ee/poteto",
      "https://www.no.lol/",
    ]);

    assert.deepEqual(
      links.map((link) => [link.kind, link.label]),
      [
        ["x", "@poteto"],
        ["github", "poteto"],
        ["linkedin", "poteto"],
        ["linktree", "poteto"],
        ["website", "no.lol"],
      ],
    );
  });
});

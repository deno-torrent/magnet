import { assertEquals, assertThrows } from "@std/assert";

import {
  build,
  isBase32,
  isBase64,
  isHex,
  isSha1Base32,
  isSha1Hex,
  isValid,
  parse,
} from "../src/magnet.ts";

// ---------------------------------------------------------------------------
// isHex
// ---------------------------------------------------------------------------

Deno.test("isHex — 合法值 / valid values", () => {
  assertEquals(isHex("0123456789abcdefABCDEF"), true);
  assertEquals(isHex("ff"), true);
  assertEquals(isHex("00"), true);
  assertEquals(isHex("DEADBEEF"), true);
});

Deno.test("isHex — 非法值 / invalid values", () => {
  assertEquals(isHex(""), false);
  assertEquals(isHex("0123456789abcdefABCDEz"), false);
  assertEquals(isHex("0123456789abcdefABCDE/"), false);
  assertEquals(isHex("hello"), false);
  assertEquals(isHex(" "), false);
});

// ---------------------------------------------------------------------------
// isBase32
// ---------------------------------------------------------------------------

Deno.test("isBase32 — 合法值 / valid values", () => {
  assertEquals(isBase32("NBSWY3DPEB3W64TMMQ======"), true);
  assertEquals(isBase32("NBSWY3DP"), true);
  assertEquals(isBase32("NBSWY3DPGEYTCMI="), true);
  // 大小写不敏感 / case-insensitive
  assertEquals(isBase32("NBSWY3DPGEYTCMIs"), true);
  assertEquals(isBase32("nbswy3dp"), true);
});

Deno.test("isBase32 — 非法值 / invalid values", () => {
  assertEquals(isBase32(""), false);
  assertEquals(isBase32("NBSWY3DPGEYTCMI=s"), false); // 填充后跟非填充字符
  assertEquals(isBase32("NBSWY3DPGEYTCM/"), false); // 非法字符 /
  assertEquals(isBase32("hello world"), false); // 含空格
});

// ---------------------------------------------------------------------------
// isBase64
// ---------------------------------------------------------------------------

Deno.test("isBase64 — 合法值 / valid values", () => {
  assertEquals(isBase64("aGVsbG8gd29ybGQz"), true);
  assertEquals(isBase64("aGVsbG8gd29ybGQ="), true);
  assertEquals(isBase64("aGVsbG8gd29ybA=="), true);
});

Deno.test("isBase64 — 非法值 / invalid values", () => {
  assertEquals(isBase64(""), false);
  assertEquals(isBase64("29ybGQ="), false); // 长度非 4 的倍数
  assertEquals(isBase64("aGVsbG8gd29ybGQ"), false); // 无填充但长度非 4 的倍数
  assertEquals(isBase64("aGVsbG8gd29ybGQ=="), false); // 长度非 4 的倍数
  assertEquals(isBase64("aGVsbG8gd29ybGQ===="), false); // 超出 2 个填充
  assertEquals(isBase64("hello world"), false); // 含空格
  assertEquals(isBase64("1234567890"), false); // 长度非 4 的倍数
});

// ---------------------------------------------------------------------------
// isSha1Hex
// ---------------------------------------------------------------------------

Deno.test("isSha1Hex — 合法值 / valid values", () => {
  assertEquals(isSha1Hex("9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b"), true);
  assertEquals(isSha1Hex("7f3c78907acced299d059b2af1b67c2550dbd429"), true);
  assertEquals(isSha1Hex("9A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B"), true);
});

Deno.test("isSha1Hex — 非法值 / invalid values", () => {
  assertEquals(isSha1Hex(""), false);
  assertEquals(isSha1Hex("ff"), false); // 过短
  assertEquals(isSha1Hex("7f3c78907acced299d059b2af1b67c2550dbd4290"), false); // 41 字符
  assertEquals(isSha1Hex("7f3c78907acced299d059b2af1b67c2550dbd42z"), false); // 含非法字符
  assertEquals(isSha1Hex("P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ"), false); // Base32
});

// ---------------------------------------------------------------------------
// isSha1Base32
// ---------------------------------------------------------------------------

Deno.test("isSha1Base32 — 合法值 / valid values", () => {
  assertEquals(isSha1Base32("P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ"), true);
  assertEquals(isSha1Base32("YNCKHTQCWBTRNJIV4WNAE52SJUQCZO5C"), true);
  // 小写也接受 / lowercase accepted
  assertEquals(isSha1Base32("p46hred2ztwsthiftmvpdnt4evinxvbj"), true);
});

Deno.test("isSha1Base32 — 非法值 / invalid values", () => {
  assertEquals(isSha1Base32(""), false);
  assertEquals(isSha1Base32("P46HRED2ZTWSTHIFTMVPDNT4EVINXVB"), false); // 31 字符
  assertEquals(isSha1Base32("P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJA"), false); // 33 字符
  assertEquals(isSha1Base32("7f3c78907acced299d059b2af1b67c2550dbd429"), false); // Hex
});

// ---------------------------------------------------------------------------
// isValid
// ---------------------------------------------------------------------------

Deno.test("isValid — 合法磁力链接 / valid magnet links", () => {
  assertEquals(
    isValid(
      "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429",
    ),
    true,
  );
  assertEquals(
    isValid("magnet:?xt=urn:btih:P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ"),
    true,
  );
  assertEquals(
    isValid(
      "magnet:?xt=urn:sha1:7f3c78907acced299d059b2af1b67c2550dbd429",
    ),
    true,
  );
});

Deno.test("isValid — 非法输入 / invalid inputs", () => {
  assertEquals(isValid(""), false);
  assertEquals(isValid("https://example.com"), false);
  assertEquals(isValid("magnet:?xt=urn:unknown:7f3c78907acced299d059b2af1b67c2550dbd429"), false);
  assertEquals(isValid("magnet:?dn=name"), false); // 无 xt 参数
  assertEquals(isValid("magnet:?xt=urn:btih:INVALID_HASH"), false);
});

// ---------------------------------------------------------------------------
// parse — 正常场景 / happy path
// ---------------------------------------------------------------------------

Deno.test("parse — btih Hex 格式 / btih Hex format", () => {
  const hexMagnet =
    "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=test";
  const result = parse(hexMagnet);

  assertEquals(result !== undefined, true);
  assertEquals(result?.hashString, "7f3c78907acced299d059b2af1b67c2550dbd429");
  assertEquals(result?.hashHex, "7f3c78907acced299d059b2af1b67c2550dbd429");
  assertEquals(result?.hash.length, 20);
  assertEquals(result?.name, "test");
  assertEquals(result?.trackers, []);
});

Deno.test("parse — btih Base32 格式 / btih Base32 format", () => {
  const base32Magnet =
    "magnet:?xt=urn:btih:P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ&dn=test";
  const result = parse(base32Magnet);

  assertEquals(result !== undefined, true);
  assertEquals(result?.hashString, "P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ");
  assertEquals(result?.hashHex, "7f3c78907acced299d059b2af1b67c2550dbd429");
  assertEquals(result?.hash.length, 20);
  assertEquals(result?.name, "test");
});

Deno.test("parse — Base32 与 Hex 解析结果哈希字节一致 / Base32 and Hex yield identical hash bytes", () => {
  const base32Magnet =
    "magnet:?xt=urn:btih:P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ&dn=test";
  const hexMagnet =
    "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=test";

  const base32Result = parse(base32Magnet);
  const hexResult = parse(hexMagnet);

  assertEquals(base32Result?.hash, hexResult?.hash);
  assertEquals(base32Result?.hashHex, hexResult?.hashHex);
});

Deno.test("parse — sha1 命名空间 / sha1 namespace", () => {
  const result = parse(
    "magnet:?xt=urn:sha1:7f3c78907acced299d059b2af1b67c2550dbd429",
  );

  assertEquals(result !== undefined, true);
  assertEquals(result?.hashHex, "7f3c78907acced299d059b2af1b67c2550dbd429");
});

Deno.test("parse — 多个 Tracker / multiple trackers", () => {
  const magnet =
    "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429" +
    "&tr=http%3A%2F%2Ftracker1.example.com%2Fannounce" +
    "&tr=http%3A%2F%2Ftracker2.example.com%2Fannounce" +
    "&dn=Test%20File";
  const result = parse(magnet);

  assertEquals(result?.trackers.length, 2);
  assertEquals(result?.trackers[0], "http://tracker1.example.com/announce");
  assertEquals(result?.trackers[1], "http://tracker2.example.com/announce");
  assertEquals(result?.name, "Test File");
});

Deno.test("parse — Tracker URL 含端口号（含冒号）/ tracker URL with port (colon inside)", () => {
  // 未编码的 tracker URL 含 ':' 不应导致解析失败
  // Unencoded tracker URL with ':' must not break parsing
  const magnet =
    "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429" +
    "&tr=http%3A%2F%2Ftracker.example.com%3A8080%2Fannounce";
  const result = parse(magnet);

  assertEquals(result !== undefined, true);
  assertEquals(result?.trackers[0], "http://tracker.example.com:8080/announce");
});

Deno.test("parse — 名称含 URL 编码 / URL-encoded name", () => {
  const magnet =
    "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429" +
    "&dn=Hello%20World%21";
  const result = parse(magnet);

  assertEquals(result?.name, "Hello World!");
});

Deno.test("parse — 无 dn 参数时 name 为 undefined / name is undefined when dn absent", () => {
  const result = parse(
    "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429",
  );
  assertEquals(result?.name, undefined);
});

// ---------------------------------------------------------------------------
// parse — 边界 / 异常场景 / edge and error cases
// ---------------------------------------------------------------------------

Deno.test("parse — 空字符串返回 undefined / empty string returns undefined", () => {
  assertEquals(parse(""), undefined);
});

Deno.test("parse — 非磁力链接返回 undefined / non-magnet string returns undefined", () => {
  assertEquals(parse("https://example.com"), undefined);
  assertEquals(parse("http://torrent.example.com/file.torrent"), undefined);
});

Deno.test("parse — 无 xt 参数返回 undefined / missing xt returns undefined", () => {
  assertEquals(parse("magnet:?dn=example"), undefined);
});

Deno.test("parse — 不支持的 NID 返回 undefined / unsupported NID returns undefined", () => {
  assertEquals(
    parse(
      "magnet:?xt=urn:ed2k:7f3c78907acced299d059b2af1b67c2550dbd429",
    ),
    undefined,
  );
});

Deno.test("parse — 哈希长度非法返回 undefined / invalid hash length returns undefined", () => {
  assertEquals(
    parse("magnet:?xt=urn:btih:deadbeef"),
    undefined,
  );
});

Deno.test("parse — 哈希含非法字符返回 undefined / invalid hash characters returns undefined", () => {
  assertEquals(
    parse("magnet:?xt=urn:btih:ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ"),
    undefined,
  );
});

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

Deno.test("build — 从 Hex 哈希构建 / from Hex hash", () => {
  const url = build("7f3c78907acced299d059b2af1b67c2550dbd429");
  assertEquals(
    url,
    "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429",
  );
});

Deno.test("build — 从 Base32 哈希构建 / from Base32 hash", () => {
  const url = build("P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ");
  assertEquals(
    url,
    "magnet:?xt=urn:btih:P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ",
  );
});

Deno.test("build — 含 name 与 trackers / with name and trackers", () => {
  const url = build("7f3c78907acced299d059b2af1b67c2550dbd429", {
    name: "My File",
    trackers: [
      "http://tracker1.example.com/announce",
      "http://tracker2.example.com/announce",
    ],
  });

  // 解析回来验证 / round-trip verify
  const result = parse(url);
  assertEquals(result?.hashHex, "7f3c78907acced299d059b2af1b67c2550dbd429");
  assertEquals(result?.name, "My File");
  assertEquals(result?.trackers.length, 2);
  assertEquals(result?.trackers[0], "http://tracker1.example.com/announce");
  assertEquals(result?.trackers[1], "http://tracker2.example.com/announce");
});

Deno.test("build — 非法哈希抛出 TypeError / invalid hash throws TypeError", () => {
  assertThrows(
    () => build("not-a-hash"),
    TypeError,
  );
  assertThrows(
    () => build(""),
    TypeError,
  );
  assertThrows(
    () => build("deadbeef"),
    TypeError,
  );
});

Deno.test("build — Hex 大写输入自动规范化为小写 / uppercase Hex normalized to lowercase", () => {
  const url = build("7F3C78907ACCED299D059B2AF1B67C2550DBD429");
  assertEquals(
    url,
    "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429",
  );
});

// ---------------------------------------------------------------------------
// build ↔ parse 往返一致性 / round-trip consistency
// ---------------------------------------------------------------------------

Deno.test("build + parse 往返一致 / round-trip consistency", () => {
  const originalHash = "7f3c78907acced299d059b2af1b67c2550dbd429";
  const url = build(originalHash, {
    name: "Test",
    trackers: ["http://tracker.example.com:6969/announce"],
  });
  const result = parse(url);

  assertEquals(result?.hashHex, originalHash);
  assertEquals(result?.name, "Test");
  assertEquals(result?.trackers[0], "http://tracker.example.com:6969/announce");
});

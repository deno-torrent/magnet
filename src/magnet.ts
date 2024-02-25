/**
 * @module
 * 磁力链接解析与构建库。
 * Magnet link parsing and building library.
 *
 * 支持 btih / sha1 命名空间，哈希格式兼容 SHA-1 Hex（40 字符）与 Base32（32 字符）。
 * Supports btih/sha1 namespaces with SHA-1 Hex (40 chars) and Base32 (32 chars) hash formats.
 *
 * @example
 * ```ts
 * import { parse, build, isValid } from "@deno-torrent/magnet";
 *
 * const info = parse("magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=example");
 * console.log(info?.hashHex); // "7f3c78907acced299d059b2af1b67c2550dbd429"
 * console.log(info?.name);    // "example"
 *
 * const url = build("7f3c78907acced299d059b2af1b67c2550dbd429", {
 *   name: "example",
 *   trackers: ["http://tracker.example.com/announce"],
 * });
 * console.log(url);
 * // magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=example&tr=http%3A%2F%2F...
 * ```
 */

import { decodeBase32 } from "@std/encoding/base32";
import { decodeHex, encodeHex } from "@std/encoding/hex";

// ---------------------------------------------------------------------------
// 公共类型 / Public types
// ---------------------------------------------------------------------------

/**
 * 磁力链接解析结果。
 * Result of parsing a magnet link.
 */
export interface MagnetInfo {
  /**
   * 原始哈希字节数组（20 字节 SHA-1）。
   * Raw hash bytes (20-byte SHA-1).
   */
  hash: Uint8Array;

  /**
   * 原始哈希字符串（保留输入格式：40 位 Hex 或 32 位 Base32）。
   * Original hash string (as-input: 40-char Hex or 32-char Base32).
   */
  hashString: string;

  /**
   * 哈希的十六进制统一表示（小写，20 字节 → 40 字符）。
   * Normalized lowercase hex representation of the hash.
   */
  hashHex: string;

  /**
   * 显示名称（`dn` 参数的第一个值），未提供时为 `undefined`。
   * Display name from the `dn` parameter, or `undefined` if absent.
   */
  name: string | undefined;

  /**
   * Tracker URL 列表（`tr` 参数的所有值，已 URL 解码）。
   * List of tracker URLs from all `tr` parameters (URL-decoded).
   */
  trackers: string[];

  /**
   * 所有查询参数的原始映射（已 URL 解码，支持多值）。
   * All query parameters (URL-decoded, multi-value supported).
   */
  params: Map<string, string[]>;
}

// ---------------------------------------------------------------------------
// 内部常量 / Internal constants
// ---------------------------------------------------------------------------

const MAGNET_PREFIX = "magnet:?";
const SUPPORTED_NIDS = new Set(["btih", "sha1"]);

// ---------------------------------------------------------------------------
// 公共 API / Public API
// ---------------------------------------------------------------------------

/**
 * 判断磁力链接字符串是否合法。
 * Returns `true` if the magnet link string is valid.
 *
 * @param magnet 待检测的磁力链接字符串。 / The magnet link string to validate.
 * @returns 合法返回 `true`，否则返回 `false`。 / `true` if valid, `false` otherwise.
 *
 * @example
 * ```ts
 * isValid("magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429"); // true
 * isValid("https://example.com"); // false
 * ```
 */
export function isValid(magnet: string): boolean {
  try {
    return parse(magnet) !== undefined;
  } catch {
    return false;
  }
}

/**
 * 解析磁力链接字符串，返回结构化信息。
 * Parses a magnet link string and returns structured information.
 *
 * 支持格式：
 * - `magnet:?xt=urn:btih:<HEX>`   — BitTorrent Info Hash，40 字符十六进制
 * - `magnet:?xt=urn:btih:<BASE32>` — BitTorrent Info Hash，32 字符 Base32
 * - `magnet:?xt=urn:sha1:<HEX>`   — SHA-1，40 字符十六进制
 * - `magnet:?xt=urn:sha1:<BASE32>` — SHA-1，32 字符 Base32
 *
 * Tracker URL 等参数值会自动进行 URL 解码；同名参数（如多个 `tr`）会合并为数组。
 *
 * @param magnet 磁力链接字符串。 / The magnet link string.
 * @returns 解析成功返回 {@link MagnetInfo}，格式不合法返回 `undefined`。
 *          Returns {@link MagnetInfo} on success, or `undefined` if invalid.
 *
 * @example
 * ```ts
 * const info = parse(
 *   "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=Test&tr=http%3A%2F%2Ft.example.com%2Fannounce"
 * );
 * info?.hashHex;        // "7f3c78907acced299d059b2af1b67c2550dbd429"
 * info?.name;           // "Test"
 * info?.trackers[0];    // "http://t.example.com/announce"
 * ```
 */
export function parse(magnet: string): MagnetInfo | undefined {
  if (typeof magnet !== "string" || !magnet.startsWith(MAGNET_PREFIX)) {
    return undefined;
  }

  const queryString = magnet.slice(MAGNET_PREFIX.length);
  const params = parseQueryString(queryString);

  const xtValues = params.get("xt");
  if (!xtValues || xtValues.length === 0) return undefined;

  // 遍历所有 xt 值，返回第一个可成功解析的结果。
  // Iterate all xt values and return the first successfully parsed one.
  for (const xt of xtValues) {
    const result = parseXt(xt, params);
    if (result) return result;
  }

  return undefined;
}

/**
 * 根据哈希字符串构建磁力链接 URL。
 * Builds a magnet link URL from a hash string.
 *
 * @param hashString SHA-1 哈希字符串：40 位十六进制或 32 位 Base32。
 *                   SHA-1 hash string: 40-char hex or 32-char Base32.
 * @param options    可选参数。 / Optional parameters.
 * @param options.name     文件显示名称（`dn`）。 / Display name (`dn`).
 * @param options.trackers Tracker URL 列表（`tr`）。 / Tracker URLs (`tr`).
 * @returns 构建好的磁力链接字符串。 / The constructed magnet link string.
 * @throws {TypeError} 当 `hashString` 格式不合法时。 / When `hashString` is invalid.
 *
 * @example
 * ```ts
 * build("7f3c78907acced299d059b2af1b67c2550dbd429", {
 *   name: "example",
 *   trackers: ["http://tracker.example.com/announce"],
 * });
 * ```
 */
export function build(
  hashString: string,
  options: { name?: string; trackers?: string[] } = {},
): string {
  if (!isSha1Hex(hashString) && !isSha1Base32(hashString)) {
    throw new TypeError(
      `Invalid hash string: expected 40-char hex or 32-char Base32, got "${hashString}"`,
    );
  }

  const normalizedHash = isSha1Hex(hashString)
    ? hashString.toLowerCase()
    : hashString.toUpperCase();

  let url = `${MAGNET_PREFIX}xt=urn:btih:${normalizedHash}`;

  if (options.name) {
    url += `&dn=${encodeURIComponent(options.name)}`;
  }

  for (const tracker of options.trackers ?? []) {
    url += `&tr=${encodeURIComponent(tracker)}`;
  }

  return url;
}

/**
 * 判断字符串是否为合法的 SHA-1 十六进制哈希（40 个十六进制字符）。
 * Returns `true` if the string is a valid SHA-1 hex hash (40 hex characters).
 *
 * @param hash 待检测字符串。 / The string to check.
 *
 * @example
 * ```ts
 * isSha1Hex("7f3c78907acced299d059b2af1b67c2550dbd429"); // true
 * isSha1Hex("P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ");          // false (Base32)
 * ```
 */
export function isSha1Hex(hash: string): boolean {
  return hash.length === 40 && isHex(hash);
}

/**
 * 判断字符串是否为合法的 SHA-1 Base32 编码哈希（32 个 Base32 字符，无填充）。
 * Returns `true` if the string is a valid SHA-1 Base32 hash (32 Base32 characters, no padding).
 *
 * @param hash 待检测字符串。 / The string to check.
 *
 * @example
 * ```ts
 * isSha1Base32("P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ"); // true
 * isSha1Base32("7f3c78907acced299d059b2af1b67c2550dbd429"); // false (Hex)
 * ```
 */
export function isSha1Base32(hash: string): boolean {
  return hash.length === 32 && isBase32(hash);
}

/**
 * 判断字符串是否为合法的十六进制字符串（仅含 `0-9`、`a-f`、`A-F`）。
 * Returns `true` if the string contains only valid hexadecimal characters.
 *
 * @param value 待检测字符串。 / The string to check.
 *
 * @example
 * ```ts
 * isHex("deadBEEF"); // true
 * isHex("xyz");      // false
 * isHex("");         // false
 * ```
 */
export function isHex(value: string): boolean {
  if (value.length === 0) return false;
  return /^[0-9a-fA-F]+$/.test(value);
}

/**
 * 判断字符串是否为合法的 Base32 字符串（含 `A-Z`、`2-7`，可带 `=` 填充，大小写不敏感）。
 * Returns `true` if the string is a valid Base32 string (case-insensitive, optional `=` padding).
 *
 * @param value 待检测字符串。 / The string to check.
 *
 * @example
 * ```ts
 * isBase32("NBSWY3DPEB3W64TMMQ======"); // true
 * isBase32("hello world");              // false
 * isBase32("");                         // false
 * ```
 */
export function isBase32(value: string): boolean {
  if (value.length === 0) return false;
  return /^[A-Z2-7]+=*$/i.test(value);
}

/**
 * 判断字符串是否为合法的 Base64 字符串（长度为 4 的倍数，末尾最多 2 个 `=` 填充）。
 * Returns `true` if the string is a valid Base64 string
 * (length multiple of 4, at most 2 trailing `=`).
 *
 * @param value 待检测字符串。 / The string to check.
 *
 * @example
 * ```ts
 * isBase64("aGVsbG8gd29ybGQ="); // true
 * isBase64("not base64!!");     // false
 * isBase64("");                  // false
 * ```
 */
export function isBase64(value: string): boolean {
  if (value.length === 0) return false;
  if (value.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(value);
}

// ---------------------------------------------------------------------------
// 内部辅助函数 / Internal helpers
// ---------------------------------------------------------------------------

/**
 * 解析单个 xt 参数值（如 `urn:btih:HASH`），结合完整 params 返回 MagnetInfo。
 * Parses a single xt value (e.g., `urn:btih:HASH`) with the full params map.
 */
function parseXt(
  xt: string,
  params: Map<string, string[]>,
): MagnetInfo | undefined {
  if (!xt.startsWith("urn:")) return undefined;

  const urnBody = xt.slice(4); // 去掉 "urn:" / strip "urn:"
  const colonIdx = urnBody.indexOf(":");
  if (colonIdx === -1) return undefined;

  const nid = urnBody.slice(0, colonIdx).toLowerCase();
  const hashString = urnBody.slice(colonIdx + 1);

  if (!SUPPORTED_NIDS.has(nid)) return undefined;

  let hash: Uint8Array | undefined;

  if (isSha1Hex(hashString)) {
    hash = decodeHex(hashString.toLowerCase());
  } else if (isSha1Base32(hashString)) {
    // decodeBase32 要求大写输入 / decodeBase32 requires uppercase input
    hash = decodeBase32(hashString.toUpperCase());
  }

  if (!hash) return undefined;

  const hashHex = encodeHex(hash);
  const dnValues = params.get("dn");
  const trValues = params.get("tr");

  return {
    hash,
    hashString,
    hashHex,
    name: dnValues?.[0],
    trackers: trValues ?? [],
    params,
  };
}

/**
 * 将查询字符串解析为多值 Map（键值均做 URL 解码）。
 * Parses a query string into a multi-value Map (both keys and values are URL-decoded).
 */
function parseQueryString(query: string): Map<string, string[]> {
  const params = new Map<string, string[]>();

  if (!query) return params;

  for (const segment of query.split("&")) {
    if (!segment) continue;

    const eqIdx = segment.indexOf("=");

    let key: string;
    let value: string;

    if (eqIdx === -1) {
      // 无值参数 / Value-less parameter
      key = safeDecodeURIComponent(segment);
      value = "";
    } else {
      key = safeDecodeURIComponent(segment.slice(0, eqIdx));
      value = safeDecodeURIComponent(segment.slice(eqIdx + 1));
    }

    const existing = params.get(key);
    if (existing) {
      existing.push(value);
    } else {
      params.set(key, [value]);
    }
  }

  return params;
}

/**
 * 安全 URL 解码：解码失败时返回原始字符串。
 * Safe URL decode: returns the original string if decoding fails.
 */
function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

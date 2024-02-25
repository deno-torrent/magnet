/**
 * @module
 * @deno-torrent/magnet 公共入口。
 * Public entry point for @deno-torrent/magnet.
 */

export type { MagnetInfo } from "./src/magnet.ts";

export {
  build,
  isBase32,
  isBase64,
  isHex,
  isSha1Base32,
  isSha1Hex,
  isValid,
  parse,
} from "./src/magnet.ts";

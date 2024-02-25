# @deno-torrent/magnet

[![JSR](https://jsr.io/badges/@deno-torrent/magnet)](https://jsr.io/@deno-torrent/magnet)
[![JSR Score](https://jsr.io/badges/@deno-torrent/magnet/score)](https://jsr.io/@deno-torrent/magnet)
[![CI](https://github.com/deno-torrent/magnet/actions/workflows/test.yml/badge.svg)](https://github.com/deno-torrent/magnet/actions/workflows/test.yml)

A native Deno / TypeScript library for parsing and building magnet links.

## Import

```typescript
import { parse, build, isValid } from "jsr:@deno-torrent/magnet";
```

## Usage

### Parse

```typescript
const info = parse(
  "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=Example&tr=http%3A%2F%2Ftracker.example.com%2Fannounce"
);

info?.hashHex;      // "7f3c78907acced299d059b2af1b67c2550dbd429"
info?.hashString;   // original format (Hex or Base32)
info?.hash;         // Uint8Array(20)
info?.name;         // "Example"
info?.trackers;     // ["http://tracker.example.com/announce"]
```

Both Hex (40 chars) and Base32 (32 chars) hash formats are supported and normalize to the same `hashHex`:

```typescript
parse("magnet:?xt=urn:btih:P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ")?.hashHex;
// "7f3c78907acced299d059b2af1b67c2550dbd429"
```

Returns `undefined` for invalid input.

### Build

```typescript
const url = build("7f3c78907acced299d059b2af1b67c2550dbd429", {
  name: "Example File",
  trackers: ["http://tracker.example.com/announce"],
});
// magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=Example%20File&tr=http%3A%2F%2F...
```

Throws `TypeError` for invalid hash strings.

### Validate

```typescript
isValid("magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429"); // true
isValid("https://example.com");                                           // false
```

## API

### `parse(magnet)`

```typescript
parse(magnet: string): MagnetInfo | undefined
```

### `build(hashString, options?)`

```typescript
build(hashString: string, options?: { name?: string; trackers?: string[] }): string
```

### `isValid(magnet)`

```typescript
isValid(magnet: string): boolean
```

### `MagnetInfo`

| Field        | Type                    | Description                                   |
|--------------|-------------------------|-----------------------------------------------|
| `hash`       | `Uint8Array`            | Raw hash bytes (20-byte SHA-1)                |
| `hashString` | `string`                | Original hash string (preserves input format) |
| `hashHex`    | `string`                | Normalized lowercase hex (40 chars)           |
| `name`       | `string \| undefined`   | Display name (`dn`), `undefined` if absent    |
| `trackers`   | `string[]`              | Tracker URLs (URL-decoded)                    |
| `params`     | `Map<string, string[]>` | All params as multi-value map (URL-decoded)   |

### Utility functions

| Function          | Description                                           |
|-------------------|-------------------------------------------------------|
| `isHex(v)`        | Whether the string is valid hexadecimal               |
| `isBase32(v)`     | Whether the string is valid Base32 (case-insensitive) |
| `isBase64(v)`     | Whether the string is valid Base64                    |
| `isSha1Hex(v)`    | Whether the string is a 40-char hex SHA-1 hash        |
| `isSha1Base32(v)` | Whether the string is a 32-char Base32 SHA-1 hash     |

## Test

```bash
deno task test
```

---

## 中文文档

磁力链接解析与构建库，纯原生 Deno / TypeScript，无第三方依赖。

### 导入

```typescript
import { parse, build, isValid } from "jsr:@deno-torrent/magnet";
```

### 解析

```typescript
const info = parse(
  "magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=示例&tr=http%3A%2F%2Ftracker.example.com%2Fannounce"
);

info?.hashHex;    // "7f3c78907acced299d059b2af1b67c2550dbd429"
info?.name;       // "示例"
info?.trackers;   // ["http://tracker.example.com/announce"]
```

同时支持 Hex（40 字符）与 Base32（32 字符）哈希格式，均统一输出到 `hashHex`。

格式不合法时返回 `undefined`。

### 构建

```typescript
const url = build("7f3c78907acced299d059b2af1b67c2550dbd429", {
  name: "示例文件",
  trackers: ["http://tracker.example.com/announce"],
});
```

哈希格式非法时抛出 `TypeError`。

### 校验

```typescript
isValid("magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429"); // true
isValid("https://example.com");                                           // false
```

## License

[MIT](./LICENSE) © deno-torrent

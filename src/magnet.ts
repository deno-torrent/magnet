import { decodeBase32 } from 'std/encoding/base32.ts'
import { decodeHex } from 'std/encoding/hex.ts'

const PREFIX = 'magnet:?xt=urn:'
const PREFIX_BITTORRENT_INFO_HASH = `${PREFIX}btih:`
const PREFIX_SHA1 = `${PREFIX}sha1:`
const PREFIX_LSIT = [PREFIX_BITTORRENT_INFO_HASH, PREFIX_SHA1]

// check is valid magnet for bittorent
export function isValid(magnet: string) {
  try {
    return parse(magnet) !== undefined
  } catch (_) {
    return false
  }
}

export function parse(magnet: string):
  | {
      hash: Uint8Array
      hashString: string
      params: Map<string, string>
    }
  | undefined {
  if (magnet === null || magnet === undefined) {
    return undefined
  }

  if (PREFIX_LSIT.every((magnet) => !magnet.startsWith(PREFIX_BITTORRENT_INFO_HASH))) {
    return undefined
  }

  // urn:<NID>:<NSS>
  // nid:Namespace Identifier
  const urn = magnet
    .replace(PREFIX, '')
    .split(':')
    .filter((item) => item.trim())

  if (urn.length != 2) {
    return undefined
  }

  const nid = urn[0]
  const nss = urn[1]
  switch (nid) {
    case 'btih': {
      return parseNSS(nss)
    }
    case 'sha1': {
      return parseNSS(nss)
    }
    default: {
      return undefined
    }
  }
}

/**
 * urn:<NID>:<NSS>
 * @param nss Namespace Specific String
 */
function parseNSS(nss: string) {
  const { hashString, params } = parseNSSToMap(nss)

  if (!hashString) {
    return undefined
  }

  let hash: Uint8Array | undefined = undefined

  // if is hex sha1
  if (isSha1Hex(hashString)) {
    hash = decodeHex(hashString)
  }
  // if is base32 sha1
  else if (isSha1Base32(hashString)) {
    hash = decodeBase32(hashString)
  }

  if (!hash) {
    return undefined
  }

  return {
    hash,
    hashString,
    params
  }
}

function parseNSSToMap(nss: string): {
  hashString: string
  params: Map<string, string>
} {
  const params = new Map<string, string>()
  // abcdef1234567890&dn=example&tr=http%3A%2F%2Ftracker.example.com%2Fannounce
  const segments = nss.split('&')
  let hashString = ''

  for (const [index, segment] of segments.entries()) {
    if (index === 0) {
      hashString = segment
    } else {
      const dict = segment.split('=')
      const key = dict[0]
      const value = dict[1]
      params.set(key, value)
    }
  }

  return {
    hashString,
    params
  }
}

/**
 * check is sha1 hex string
 * e.g. magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429
 * @param hash
 * @returns
 */
export function isSha1Hex(hash: string) {
  return hash.length === 40 && isHex(hash)
}

/**
 * check is sha1 base32 string
 *
 * e.g. magnet:?xt=urn:sha1:YNCKHTQCWBTRNJIV4WNAE52SJUQCZO5C
 * @param hash
 * @returns
 */
export function isSha1Base32(hash: string) {
  return hash.length === 32 && isBase32(hash)
}

/**
 * check is hex string
 * @param value
 */
export function isHex(value: string) {
  if (value.length === 0) {
    return false
  }

  return /^[0-9a-fA-F]+$/.test(value)
}

/**
 * check is base32 string
 * @param value
 */
export function isBase32(value: string) {
  if (value.length === 0) {
    return false
  }

  return /^[A-Z2-7]+=*$/i.test(value)
}

/**
 * check is base64 string
 * @param value
 */
export function isBase64(value: string) {
  if (value.length === 0) {
    return false
  }

  if (value.length % 4 != 0) {
    return false
  }

  return /^[A-Za-z0-9+/]*={0,2}$/.test(value)
}

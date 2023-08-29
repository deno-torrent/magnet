import { assertEquals } from 'std/assert/assert_equals.ts'
import { isBase32, isBase64, isHex, isSha1Hex, parse } from '../src/magnet.ts'

Deno.test('test isBase64', () => {
  assertEquals(isBase64('aGVsbG8gd29ybGQz'), true)
  assertEquals(isBase64('aGVsbG8gd29ybGQ='), true)
  assertEquals(isBase64('aGVsbG8gd29ybA=='), true)

  assertEquals(isBase64('29ybGQ='), false)
  assertEquals(isBase64('aGVsbG8gd29ybGQ'), false)
  assertEquals(isBase64('SGVsbG8gd29ybGQ'), false)
  assertEquals(isBase64('hello world'), false)
  assertEquals(isBase64('aGVsbG8gd29ybGQ=='), false)
  assertEquals(isBase64('aGVsbG8gd29ybGQ===='), false)
  assertEquals(isBase64('SGVsbG8gd29ybGQ===='), false)
  assertEquals(isBase64('aGVsbG8gd29ybA'), false)
  assertEquals(isBase64('aGVsbG8gd29ybGQ'), false)
  assertEquals(isBase64('1234567890'), false)
  assertEquals(isBase64(''), false)
})

Deno.test('test isHex', () => {
  assertEquals(isHex('0123456789abcdefABCDEF'), true)
  assertEquals(isHex('ff'), true)

  assertEquals(isHex('0123456789abcdefABCDEz'), false)
  assertEquals(isHex('0123456789abcdefABCDE/'), false)
  assertEquals(isHex(''), false)
})

Deno.test('test isBase32', () => {
  assertEquals(isBase32('NBSWY3DPEB3W64TMMQ======'), true)
  assertEquals(isBase32('NBSWY3DP'), true)
  assertEquals(isBase32('NBSWY3DPGEYTCMI='), true)
  assertEquals(isBase32('NBSWY3DPGEYTCMIs'), true)

  assertEquals(isBase32('NBSWY3DPGEYTCMI=s'), false)
  assertEquals(isBase32('NBSWY3DPGEYTCM/'), false)
  assertEquals(isBase32(''), false)
})

Deno.test('test isSha1Hex', () => {
  assertEquals(isSha1Hex('9A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B'), true)
  assertEquals(isSha1Hex('5F4E3D2C1B0A9998B7C6D5E4F3A2B1C0D9E8F7AC'), true)
  assertEquals(isSha1Hex('0B1C2D3E4F5A69788190A2B3C4D5E6F708192A3D'), true)
  assertEquals(isSha1Hex('A3B4C5D6E7F8A9B8C7D6E5F4A3B2C1D0E9F8A7BC'), true)
  assertEquals(isSha1Hex('2B1C0D9E8FA7B6C5D4E3F2A1B0C9D8E7F6A5B4CE'), true)
  assertEquals(isSha1Hex('D5E6F708192A3B4C5D6E7F8A9B8C7D6E5F4A3B2F'), true)

  assertEquals(isSha1Hex('012345asd67d89as4cda12defA1sBCx2Dsk5a2EF'), false)
  assertEquals(isSha1Hex('ff'), false)
  assertEquals(isSha1Hex('0123456789abcdefABCDEz'), false)
  assertEquals(isSha1Hex('0123456789abcdefABCDE/'), false)
  assertEquals(isSha1Hex(''), false)
})

Deno.test('test parse', () => {
  const base32Magnet = 'magnet:?xt=urn:btih:P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ&dn=test'
  const hexMagnet = 'magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=test'

  const base32Result = parse(base32Magnet)
  const hexResult = parse(hexMagnet)

  assertEquals(base32Result?.hash, hexResult?.hash)
  assertEquals(base32Result?.args.get('HASH_STRING'), 'P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ')
  assertEquals(hexResult?.args.get('HASH_STRING'), '7f3c78907acced299d059b2af1b67c2550dbd429')
  assertEquals(base32Result?.args.get('dn'), 'test')
  assertEquals(hexResult?.args.get('dn'), 'test')
})

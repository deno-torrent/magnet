# [magnet](https://deno.land/x/dt_magnet) [![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Flatest-version%2Fx%2Fdt_magnet%2Fmod.ts)](https://deno.land/x/dt_magnet)

a deno magnet module

## Useage

```typescript
import { parse } from "https://deno.land/x/dt_magnet/mod.ts";

    const base32Magnet = 'magnet:?xt=urn:btih:P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ&dn=test'
    const hexMagnet = 'magnet:?xt=urn:btih:7f3c78907acced299d059b2af1b67c2550dbd429&dn=test'

    const base32Result = parse(base32Magnet)
    // output
    // {
    //   hash: Uint8Array(20) [
    //     127,  60, 120, 144, 122, 204,
    //     237,  41, 157,   5, 155,  42,
    //     241, 182, 124,  37,  80, 219,
    //     212,  41
    //   ],
    //   params: Map(2) {
    //     "HASH_STRING" => "P46HRED2ZTWSTHIFTMVPDNT4EVINXVBJ",
    //     "dn" => "test"
    //   }
    // }
  
    const hexResult = parse(hexMagnet)
    // output
    //  {
    //   hash: Uint8Array(20) [
    //     127,  60, 120, 144, 122, 204,
    //     237,  41, 157,   5, 155,  42,
    //     241, 182, 124,  37,  80, 219,
    //     212,  41
    //   ],
    //   params: Map(2) {
    //     "HASH_STRING" => "7f3c78907acced299d059b2af1b67c2550dbd429",
    //     "dn" => "test"
    //   }
    // }

```

### Test

```bash
# running 5 tests from ./test/magnet.test.ts
# test isBase64 ... ok (9ms)
# test isHex ... ok (5ms)
# test isBase32 ... ok (5ms)
# test isSha1Hex ... ok (6ms)
# test parse ... ok (6ms)
```

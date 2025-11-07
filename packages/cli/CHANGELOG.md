# @ucdjs/cli

## 0.3.0

### Minor Changes

- [#59](https://github.com/ucdjs/ucd/pull/59) [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate ucd-store to use utils

- [#71](https://github.com/ucdjs/ucd/pull/71) [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c) Thanks [@luxass](https://github.com/luxass)! - Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

- [#66](https://github.com/ucdjs/ucd/pull/66) [`09fb839`](https://github.com/ucdjs/ucd/commit/09fb8396302428b395878110f9e593eacabae7b5) Thanks [@luxass](https://github.com/luxass)! - implement store command

- [#35](https://github.com/ucdjs/ucd/pull/35) [`a67a5b7`](https://github.com/ucdjs/ucd/commit/a67a5b75679dc8c4ba73743e5d6ffa2c18132439) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate cli to ucd-store download

### Patch Changes

- [#45](https://github.com/ucdjs/ucd/pull/45) [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31) Thanks [@luxass](https://github.com/luxass)! - unify filtering across stores

- [#49](https://github.com/ucdjs/ucd/pull/49) [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af) Thanks [@luxass](https://github.com/luxass)! - move filter's to utils pkg

- Updated dependencies [[`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`d7b8d08`](https://github.com/ucdjs/ucd/commit/d7b8d088060b2ee473f325b1173cbb67f05ccb2f), [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31), [`2222605`](https://github.com/ucdjs/ucd/commit/22226057f7587669e2ae15cd06011f38dd677741), [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab), [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c), [`82eb12e`](https://github.com/ucdjs/ucd/commit/82eb12e1d1944ebbe2748ec129a2d2b2fa315946), [`d4bdcfd`](https://github.com/ucdjs/ucd/commit/d4bdcfd5a5cd0fc3e2a6e2620a26f5e6f835af40), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35), [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af), [`bea2c3c`](https://github.com/ucdjs/ucd/commit/bea2c3c672aee24080eef7b973c7f3c00acb1b6f), [`ec348bb`](https://github.com/ucdjs/ucd/commit/ec348bb9cea0285222347526cf5be5d14d9d61ea), [`1bac88a`](https://github.com/ucdjs/ucd/commit/1bac88add4796ef58f9b9b1d769ab03cdd4a61c0), [`69ee629`](https://github.com/ucdjs/ucd/commit/69ee629e77ad2f83a663cb7c6e8aa07fb9655a12), [`85c248b`](https://github.com/ucdjs/ucd/commit/85c248bc8f5304ee6ba56e2ded6d81ce3facd00e), [`6a43284`](https://github.com/ucdjs/ucd/commit/6a432841e12d6e5783822cc8fe2586ae2b5ab4e1), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9), [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03), [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61), [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55)]:
  - @ucdjs/ucd-store@0.1.0
  - @ucdjs/schema-gen@0.2.2

## 0.2.2

### Patch Changes

- [#18](https://github.com/ucdjs/ucd/pull/18) [`24e8218`](https://github.com/ucdjs/ucd/commit/24e821845bf6a7b9c95b0db467b099440976c71c) Thanks [@luxass](https://github.com/luxass)! - feat: create comment files flag

## 0.2.1

### Patch Changes

- [#16](https://github.com/ucdjs/ucd/pull/16) [`846b18a`](https://github.com/ucdjs/ucd/commit/846b18a4ddf7c97062fc8367121809cd80950ab0) Thanks [@luxass](https://github.com/luxass)! - feat: add support for excluding draft in file download

## 0.2.0

### Minor Changes

- [#15](https://github.com/ucdjs/ucd/pull/15) [`24ce563`](https://github.com/ucdjs/ucd/commit/24ce563760b0efcf33ff9219d01868c195bb63ac) Thanks [@luxass](https://github.com/luxass)! - feat!: remove generate cmd in favor of the new download cmd

- [#13](https://github.com/ucdjs/ucd/pull/13) [`4e59266`](https://github.com/ucdjs/ucd/commit/4e592668e45fec9b15de0a1395708e694a9a8500) Thanks [@luxass](https://github.com/luxass)! - feat: add new download cmd

- [`381b40d`](https://github.com/ucdjs/ucd/commit/381b40d654c9c10d3c8b4f82bdeab3003b6a79d4) Thanks [@luxass](https://github.com/luxass)! - implement concurrency for codegen

### Patch Changes

- Updated dependencies [[`78f4673`](https://github.com/ucdjs/ucd/commit/78f4673657a210eb374a025dabe7450291712a0a)]:
  - @ucdjs/schema-gen@0.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`99eccc9`](https://github.com/ucdjs/ucd/commit/99eccc9bc76904e2e2b5c2233229857235841091)]:
  - @ucdjs/schema-gen@0.2.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`d55695d`](https://github.com/ucdjs/ucd/commit/d55695d16b6ec74953e2f2314500d70590eb5d1a)]:
  - @ucdjs/schema-gen@0.1.0

## 0.1.1

### Patch Changes

- [#3](https://github.com/ucdjs/ucd/pull/3) [`290e73d`](https://github.com/ucdjs/ucd/commit/290e73d29439c7102ead994f29b4d5797fb33eca) Thanks [@luxass](https://github.com/luxass)! - feat: enhance generate experience

## 0.1.0

### Minor Changes

- [#1](https://github.com/ucdjs/ucd/pull/1) [`bb3d880`](https://github.com/ucdjs/ucd/commit/bb3d880b8f824d5a2d7a9e0e627a94a6cc456355) Thanks [@luxass](https://github.com/luxass)! - feat: add generate cmd

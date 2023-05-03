# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0-alpha.0](https://github.com/SuperFlyTV/xkeys/compare/v2.3.4...v3.0.0-alpha.0) (2022-06-22)

### Features

- BREAKING CHANGE: Dropped support for EOL versions of Node.js (<14).
- Add support for the [RailDriver](https://raildriver.com/).
- Add support for panels with multiple background-light banks (added an argument for bankIndex to `.setBacklight()` & `.setAllBacklights()`)
- Add support for a few upcoming X-keys panels, including features like trackball, rotary

# [2.4.0](https://github.com/SuperFlyTV/xkeys/compare/v2.3.4...v2.4.0) (2022-10-26)

### Bug Fixes

- update usb dep ([e1bc906](https://github.com/SuperFlyTV/xkeys/commit/e1bc9060e4ef82dce690a2bb76fb01601ed28f7a))

### Features

- replace usb-detection with usb ([d6349ef](https://github.com/SuperFlyTV/xkeys/commit/d6349ef0b0477045dd8a540887918cc2af8370aa))

## [2.3.4](https://github.com/SuperFlyTV/xkeys/compare/v2.3.3...v2.3.4) (2022-06-06)

### Bug Fixes

- ignore engines for node10 in ci ([8c88b43](https://github.com/SuperFlyTV/xkeys/commit/8c88b43f9d694ac82d094b82042c82bde25e5bd1))
- pre-commit hook ([887fbb2](https://github.com/SuperFlyTV/xkeys/commit/887fbb2f9b89369dfaa0ccf851646252af9686af))
- Watcher: async handling of adding/removing devices ([61f0b28](https://github.com/SuperFlyTV/xkeys/commit/61f0b28571a3df72b49f4bd84b6d842408e86acd))

## [2.3.2](https://github.com/SuperFlyTV/xkeys/compare/v2.3.0...v2.3.2) (2021-12-12)

### Bug Fixes

- add XKeys.writeData() method, used for testing and development ([fba879c](https://github.com/SuperFlyTV/xkeys/commit/fba879c0f93ee64fbcdbd7faf5863998300c2016))

# [2.3.0](https://github.com/SuperFlyTV/xkeys/compare/v2.2.1...v2.3.0) (2021-11-28)

## [2.3.4](https://github.com/SuperFlyTV/xkeys/compare/v2.3.3...v2.3.4) (2022-06-06)

### Bug Fixes

- ignore engines for node10 in ci ([8c88b43](https://github.com/SuperFlyTV/xkeys/commit/8c88b43f9d694ac82d094b82042c82bde25e5bd1))
- pre-commit hook ([887fbb2](https://github.com/SuperFlyTV/xkeys/commit/887fbb2f9b89369dfaa0ccf851646252af9686af))
- Watcher: async handling of adding/removing devices ([61f0b28](https://github.com/SuperFlyTV/xkeys/commit/61f0b28571a3df72b49f4bd84b6d842408e86acd))

## [2.3.2](https://github.com/SuperFlyTV/xkeys/compare/v2.3.0...v2.3.2) (2021-12-12)

### Bug Fixes

- add XKeys.writeData() method, used for testing and development ([fba879c](https://github.com/SuperFlyTV/xkeys/commit/fba879c0f93ee64fbcdbd7faf5863998300c2016))

# [2.3.0](https://github.com/SuperFlyTV/xkeys/compare/v2.2.1...v2.3.0) (2021-11-28)

### Features

- add usePolling option to the XKeysWatcher to fall back to polling, since "usb-detection" might not work on all OS:es ([ab31223](https://github.com/SuperFlyTV/xkeys/commit/ab312236b14cb8f961d0b0bf878c611487a5983f))

## [2.2.1](https://github.com/SuperFlyTV/xkeys/compare/v2.2.0...v2.2.1) (2021-09-22)

**Note:** Version bump only for package xkeys-monorepo

# [2.2.0](https://github.com/SuperFlyTV/xkeys/compare/v2.2.0-alpha.1...v2.2.0) (2021-09-08)

**Note:** Version bump only for package xkeys-monorepo

# [2.2.0-alpha.1](https://github.com/SuperFlyTV/xkeys/compare/v2.2.0-alpha.0...v2.2.0-alpha.1) (2021-09-06)

### Bug Fixes

- re-add devicePath ([349f6a9](https://github.com/SuperFlyTV/xkeys/commit/349f6a93ace9480e18d5ed695186920165fea6e7))

# [2.2.0-alpha.0](https://github.com/SuperFlyTV/xkeys/compare/v2.1.1...v2.2.0-alpha.0) (2021-09-06)

### Features

- add feature: "Automatic UnitId mode" ([f7c3a86](https://github.com/SuperFlyTV/xkeys/commit/f7c3a869e8820f856831aad576ce7978dfb9d75c))
- add XKeys.uniqueId property, to be used with automaticUnitIdMode ([a2e6d7a](https://github.com/SuperFlyTV/xkeys/commit/a2e6d7a6ec917d82bc2a71c1922c22c061232908))

## [2.1.1](https://github.com/SuperFlyTV/xkeys/compare/v2.1.1-alpha.1...v2.1.1) (2021-05-24)

**Note:** Version bump only for package xkeys-monorepo

## [2.1.1-alpha.1](https://github.com/SuperFlyTV/xkeys/compare/v2.1.1-alpha.0...v2.1.1-alpha.1) (2021-05-23)

### Bug Fixes

- hack to fix issue in Electron ([501f06d](https://github.com/SuperFlyTV/xkeys/commit/501f06de9a2413832dab4b6a0ef4ef7d2b668967))
- make XKeysWatcher.stop() close all the devices it has called setupXkeysPanel() for. ([f69b599](https://github.com/SuperFlyTV/xkeys/commit/f69b59912a62b8dcc5ff00a2083c793851bba15c))

## [2.1.1-alpha.0](https://github.com/SuperFlyTV/xkeys/compare/v2.1.0...v2.1.1-alpha.0) (2021-05-23)

### Bug Fixes

- remove listeners on watcher.stop() ([c8d36a3](https://github.com/SuperFlyTV/xkeys/commit/c8d36a3602b8c460233b82a48f6c28a04f52c9de))

# [2.1.0](https://github.com/SuperFlyTV/xkeys/compare/v2.1.0-alpha.0...v2.1.0) (2021-05-15)

**Note:** Version bump only for package xkeys-monorepo

# [2.1.0-alpha.1](https://github.com/SuperFlyTV/xkeys/compare/v2.1.0-alpha.0...v2.1.0-alpha.1) (2021-05-10)

**Note:** Version bump only for package xkeys-monorepo

# [2.1.0-alpha.0](https://github.com/SuperFlyTV/xkeys/compare/v2.0.0...v2.1.0-alpha.0) (2021-05-10)

### Bug Fixes

- publication-script for the node-record-test executable (wip) ([e4a8071](https://github.com/SuperFlyTV/xkeys/commit/e4a80719686048b010976d464adb6a40bf86b3c0))
- refactor repo into lerna mono-repo ([d5bffc1](https://github.com/SuperFlyTV/xkeys/commit/d5bffc1798e7c8e89ae9fcc4355afd438ea82d3a))

### Features

- add package with web-HID support ([1f27199](https://github.com/SuperFlyTV/xkeys/commit/1f2719969faf93ba45a2bc767f64543fb9ffe6ea))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/SuperFlyTV/xkeys/compare/v1.1.1...v2.0.0) (2021-04-16)

### Features

- emit precalculated deltaZ for joystick ([2dad07b](https://github.com/SuperFlyTV/xkeys/commit/2dad07b895ba1c284a708a017eb6e7008e2e15a9))
- Refactor & improve ([0ce375e](https://github.com/SuperFlyTV/xkeys/commit/0ce375ef4f16ccdfa05623f4382084fecbe4162d))

### Bug Fixes

- bug for joystick deltaZ ([41cd561](https://github.com/SuperFlyTV/xkeys/commit/41cd5618e48f8b07c9bcbe9a5760c02e3cadb529))
- compare new values with old, not the other way around ([71e1801](https://github.com/SuperFlyTV/xkeys/commit/71e1801e2fbf5a8c3e9e1f71cc839ada72eb796c))
- joystick bug ([84d2150](https://github.com/SuperFlyTV/xkeys/commit/84d21503ff670f1e4b6d1f021d1b98b1c661fc55))
- the emitted timestamp is undefined for some products ([a45ee1f](https://github.com/SuperFlyTV/xkeys/commit/a45ee1fd7982d40ef9b3f97f0ffa6c2a7d928d71))
- use type imports ([373e6b4](https://github.com/SuperFlyTV/xkeys/commit/373e6b40144e9d51ec064cb50deb315a50f24868))
- use XKeys.listAllConnectedPanels to DRY it up ([d49827d](https://github.com/SuperFlyTV/xkeys/commit/d49827d093474eeebd9d294c4f7c391c54c5daec))

### [1.1.1](https://github.com/SuperFlyTV/xkeys/compare/v1.1.0...v1.1.1) (2021-01-15)

### Bug Fixes

- remove spammy console.log [release] ([e3a0feb](https://github.com/SuperFlyTV/xkeys/commit/e3a0feb0b48686adc1eb2b431a140c25c721c906))

## [1.1.0](https://github.com/SuperFlyTV/xkeys/compare/v1.0.0...v1.1.0) (2021-01-06)

### [1.1.0-0](https://github.com/SuperFlyTV/xkeys/compare/v1.0.0...v1.0.1-0) (2021-01-06)

- Add support for XKE-124 T-bar ([PR](https://github.com/SuperFlyTV/xkeys/pull/23))

## [1.0.0](https://github.com/SuperFlyTV/xkeys/compare/v0.1.1...v1.0.0) (2020-10-27)

### Bug Fixes

- add (guessed) banks for XK16, XK8 & XK4 ([a47834b](https://github.com/SuperFlyTV/xkeys/commit/a47834be031d29033dd04f5978dd7156c473a282))
- add best-guesses for banks property, for untested products ([8ecffec](https://github.com/SuperFlyTV/xkeys/commit/8ecffeca442b1b5b06fe683b30a4d05e55fb010f))
- setBacklightIntensity improvements (thanks to [@jonwyett](https://github.com/jonwyett)) ([a75d330](https://github.com/SuperFlyTV/xkeys/commit/a75d330f2161cf8b9d191feec2985ff14a36689d))
- typings fixes ([a8a7193](https://github.com/SuperFlyTV/xkeys/commit/a8a7193ba44bc691676161dcb3955d7184c1dbae))
- updated node-hid dependencies ([0ec22e1](https://github.com/SuperFlyTV/xkeys/commit/0ec22e10e9f471ed6a9555847a7f37a645e75228))
- upgrade dependencies ([98bb387](https://github.com/SuperFlyTV/xkeys/commit/98bb3878ece0f4e5032d31200ba641b881e40006))
- use device.interface instead of device.usage ([2883c46](https://github.com/SuperFlyTV/xkeys/commit/2883c466f2ea26585a14b6e9765fa4146ba17554))

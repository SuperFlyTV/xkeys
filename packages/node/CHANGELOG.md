# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.3.0](https://github.com/SuperFlyTV/xkeys/compare/v3.2.0...v3.3.0) (2024-12-09)


### Features

* add flush() method, resolves [#106](https://github.com/SuperFlyTV/xkeys/issues/106) ([f0ade46](https://github.com/SuperFlyTV/xkeys/commit/f0ade467a900500fdeaf55603ae729f136316746))





# [3.2.0](https://github.com/SuperFlyTV/xkeys/compare/v3.1.2...v3.2.0) (2024-08-26)


### Features

* Add XkeysWatcher to WebHID version, rework XkeysWatcher to share code between node & webHID versions ([34bbd3c](https://github.com/SuperFlyTV/xkeys/commit/34bbd3cbd765d97f3d4f52690f78d4cfef5817a2))





## [3.1.2](https://github.com/SuperFlyTV/xkeys/compare/v3.1.1...v3.1.2) (2024-08-12)


### Bug Fixes

* event listeners in node-hid-wapper to follow style in web-hid-wrapper. ([ee1d6c6](https://github.com/SuperFlyTV/xkeys/commit/ee1d6c6c110ddb70fbdeafd389c9c4504ee17f8c))





## [3.1.1](https://github.com/SuperFlyTV/xkeys/compare/v3.1.0...v3.1.1) (2024-03-04)

**Note:** Version bump only for package xkeys





# [3.1.0](https://github.com/SuperFlyTV/xkeys/compare/v3.0.1...v3.1.0) (2024-01-11)


### Bug Fixes

* expose Xkeys.filterDevice() static method, used to filter for compatible X-keys devices when manually handling HID devices ([ab542a8](https://github.com/SuperFlyTV/xkeys/commit/ab542a8630c749f79cd21c4589eb263c6017ea99))
* remove hack (possible HID.HID that exposed a devicePath) ([fca382d](https://github.com/SuperFlyTV/xkeys/commit/fca382dd5109a8447ed7ba51d485de255487bd6d))
* remove support for HID.HID and HID.Async devices in setupXKeysPanel. ([1bc87ba](https://github.com/SuperFlyTV/xkeys/commit/1bc87ba26227831eb7f312e59eb15f9ed47497e1))
* support providing HID.HIDAsync into setupXkeysPanel() ([190d4a1](https://github.com/SuperFlyTV/xkeys/commit/190d4a1c2dfa1232b250318c30131624cf67fb23))
* typo ([095c064](https://github.com/SuperFlyTV/xkeys/commit/095c0640a52b920774965192cfb868badb82f012))


### Features

* use async node-hid ([429c5ea](https://github.com/SuperFlyTV/xkeys/commit/429c5ea6e83f5a8a025180d3c6a15943bddaf5d6))





## [3.0.1](https://github.com/SuperFlyTV/xkeys/compare/v3.0.0...v3.0.1) (2023-11-02)

**Note:** Version bump only for package xkeys





# [3.0.0](https://github.com/SuperFlyTV/xkeys/compare/v2.4.0...v3.0.0) (2023-05-03)

- BREAKING CHANGE: Dropped support for EOL versions of Node.js (<14).

# [2.4.0](https://github.com/SuperFlyTV/xkeys/compare/v2.3.4...v2.4.0) (2022-10-26)

### Bug Fixes

- update usb dep ([e1bc906](https://github.com/SuperFlyTV/xkeys/commit/e1bc9060e4ef82dce690a2bb76fb01601ed28f7a))

### Features

- replace usb-detection with usb ([d6349ef](https://github.com/SuperFlyTV/xkeys/commit/d6349ef0b0477045dd8a540887918cc2af8370aa))

## [2.3.4](https://github.com/SuperFlyTV/xkeys/compare/v2.3.3...v2.3.4) (2022-06-06)

### Bug Fixes

- Watcher: async handling of adding/removing devices ([61f0b28](https://github.com/SuperFlyTV/xkeys/commit/61f0b28571a3df72b49f4bd84b6d842408e86acd))

## [2.3.2](https://github.com/SuperFlyTV/xkeys/compare/v2.3.0...v2.3.2) (2021-12-12)

**Note:** Version bump only for package xkeys

# [2.3.0](https://github.com/SuperFlyTV/xkeys/compare/v2.2.1...v2.3.0) (2021-11-28)

### Features

- add usePolling option to the XKeysWatcher to fall back to polling, since "usb-detection" might not work on all OS:es ([ab31223](https://github.com/SuperFlyTV/xkeys/commit/ab312236b14cb8f961d0b0bf878c611487a5983f))

## [2.2.1](https://github.com/SuperFlyTV/xkeys/compare/v2.2.0...v2.2.1) (2021-09-22)

**Note:** Version bump only for package xkeys

# [2.2.0](https://github.com/SuperFlyTV/xkeys/compare/v2.2.0-alpha.1...v2.2.0) (2021-09-08)

**Note:** Version bump only for package xkeys

# [2.2.0-alpha.1](https://github.com/SuperFlyTV/xkeys/compare/v2.2.0-alpha.0...v2.2.0-alpha.1) (2021-09-06)

### Bug Fixes

- re-add devicePath ([349f6a9](https://github.com/SuperFlyTV/xkeys/commit/349f6a93ace9480e18d5ed695186920165fea6e7))

# [2.2.0-alpha.0](https://github.com/SuperFlyTV/xkeys/compare/v2.1.1...v2.2.0-alpha.0) (2021-09-06)

### Features

- add feature: "Automatic UnitId mode" ([f7c3a86](https://github.com/SuperFlyTV/xkeys/commit/f7c3a869e8820f856831aad576ce7978dfb9d75c))
- add XKeys.uniqueId property, to be used with automaticUnitIdMode ([a2e6d7a](https://github.com/SuperFlyTV/xkeys/commit/a2e6d7a6ec917d82bc2a71c1922c22c061232908))

## [2.1.1](https://github.com/SuperFlyTV/xkeys/compare/v2.1.1-alpha.1...v2.1.1) (2021-05-24)

**Note:** Version bump only for package xkeys

## [2.1.1-alpha.1](https://github.com/SuperFlyTV/xkeys/compare/v2.1.1-alpha.0...v2.1.1-alpha.1) (2021-05-23)

### Bug Fixes

- hack to fix issue in Electron ([501f06d](https://github.com/SuperFlyTV/xkeys/commit/501f06de9a2413832dab4b6a0ef4ef7d2b668967))
- make XKeysWatcher.stop() close all the devices it has called setupXkeysPanel() for. ([f69b599](https://github.com/SuperFlyTV/xkeys/commit/f69b59912a62b8dcc5ff00a2083c793851bba15c))

## [2.1.1-alpha.0](https://github.com/SuperFlyTV/xkeys/compare/v2.1.0...v2.1.1-alpha.0) (2021-05-23)

### Bug Fixes

- remove listeners on watcher.stop() ([c8d36a3](https://github.com/SuperFlyTV/xkeys/commit/c8d36a3602b8c460233b82a48f6c28a04f52c9de))

# [2.1.0](https://github.com/SuperFlyTV/xkeys/compare/v2.1.0-alpha.0...v2.1.0) (2021-05-15)

**Note:** Version bump only for package xkeys

# [2.1.0-alpha.1](https://github.com/SuperFlyTV/xkeys/compare/v2.1.0-alpha.0...v2.1.0-alpha.1) (2021-05-10)

**Note:** Version bump only for package xkeys

# [2.1.0-alpha.0](https://github.com/SuperFlyTV/xkeys/compare/v2.0.0...v2.1.0-alpha.0) (2021-05-10)

### Bug Fixes

- refactor repo into lerna mono-repo ([d5bffc1](https://github.com/SuperFlyTV/xkeys/commit/d5bffc1798e7c8e89ae9fcc4355afd438ea82d3a))

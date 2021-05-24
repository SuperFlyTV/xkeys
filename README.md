# xkeys

[![Node CI](https://github.com/SuperFlyTV/xkeys/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/SuperFlyTV/xkeys/actions/workflows/lint-and-test.yml)

A Node.js module to interact with the [X-keys panels](https://xkeys.com/xkeys.html).

Licence: MIT

The project is based on the documentation available here: http://xkeys.com/PISupport/DeveloperHIDDataReports.php

## Demo

If you are using a Chromium v89+ based browser, you can try out the library right away, in the browser: [Demo](https://SuperFlyTV.github.io/xkeys/).

## Installation

### To use in Node.js

```
$ npm install --save xkeys
or
$ yarn add xkeys
```

### To use in browser

```
$ npm install --save xkeys-webhid
or
$ yarn add xkeys-webhid
```

### Linux

On linux, the udev subsystem blocks access for non-root users to the X-keys without some special configuration. Save the following to `/etc/udev/rules.d/50-xkeys.rules` and reload the rules with `sudo udevadm control --reload-rules`

```
SUBSYSTEM=="input", GROUP="input", MODE="0666"
SUBSYSTEM=="usb", ATTRS{idVendor}=="05f3", MODE:="666", GROUP="plugdev"
KERNEL=="hidraw*", ATTRS{idVendor}=="05f3", MODE="0666", GROUP="plugdev"
```

## BREAKING CHANGES

Please note that version `2.0.0` is a _BREAKING CHANGE_, as most of the API have changed.
If you're upgrading from `<2.0.0`, please read the [_Migrations_](#Migrations) section below.

## Getting started - Node.js

### Watch for connected X-keys (recommended)

This is the recommended way to use this library, to automatically be connected or reconnected to the panel.

_Note: The watcher depends on the [node-usb-detection](https://github.com/MadLittleMods/node-usb-detection) library, which might be unsupported on some platforms._

```javascript
const { XKeysWatcher } = require('xkeys')

const watcher = new XKeysWatcher()

watcher.on('connected', (xkeysPanel) => {
	console.log(`X-keys panel of type ${xkeysPanel.info.name} connected`)

	xkeysPanel.on('disconnected', () => {
		console.log(`X-keys panel of type ${xkeysPanel.info.name} was disconnected`)
		// Clean up stuff
		xkeysPanel.removeAllListeners()
	})
	xkeysPanel.on('error', (...errs) => {
		console.log('X-keys error:', ...errs)
	})

	// Listen to pressed buttons:
	xkeysPanel.on('down', (btnIndex, metadata) => {
		console.log('Button pressed ', btnIndex, metadata)

		// Light up a button when pressed:
		xkeysPanel.setBacklight(btnIndex, 'red')
	})
	// Listen to released buttons:
	xkeysPanel.on('up', (btnIndex, metadata) => {
		console.log('Button released', btnIndex, metadata)

		// Turn off button light when released:
		xkeysPanel.setBacklight(btnIndex, false)
	})

	// Listen to jog wheel changes:
	xkeysPanel.on('jog', (index, deltaPos, metadata) => {
		console.log(`Jog ${index} position has changed`, deltaPos, metadata)
	})
	// Listen to shuttle changes:
	xkeysPanel.on('shuttle', (index, shuttlePos, metadata) => {
		console.log(`Shuttle ${index} position has changed`, shuttlePos, metadata)
	})
	// Listen to joystick changes:
	xkeysPanel.on('joystick', (index, position, metadata) => {
		console.log(`Joystick ${index} position has changed`, position, metadata) // {x, y, z}
	})
	// Listen to t-bar changes:
	xkeysPanel.on('tbar', (index, position, metadata) => {
		console.log(`T-bar ${index} position has changed`, position, metadata)
	})
})

// To stop watching, call
// watcher.stop() // Returns a promise
// .catch(console.error)
```

### Connect to a devices manually

```javascript
const { XKeys } = require('xkeys')

// Connect to any xkeys-panel:
XKeys.setupXkeysPanel()
	.then((xkeysPanel) => {
		xkeysPanel.on('disconnected', () => {
			console.log(`X-keys panel of type ${xkeysPanel.info.name} was disconnected`)
			// Clean up stuff
			xkeysPanel.removeAllListeners()
		})
		xkeysPanel.on('error', (...errs) => {
			console.log('X-keys error:', ...errs)
		})

		xkeysPanel.on('down', (btnIndex, metadata) => {
			console.log('Button pressed', btnIndex, metadata)
		})

		// ...
	})
	.catch(console.log) // Handle error
```

or

```javascript
const { XKeys } = require('xkeys')

// List and connect to xkeys-panel:
XKeys.listAllConnectedPanels().forEach(() => {
	XKeys.setupXkeysPanel()
		.then((xkeysPanel) => {
			// ...
		})
		.catch(console.log) // Handle error
})
```

## Getting started - Browser (WebHID)

See the example implementation at [packages/webhid-demo](packages/webhid-demo).

### Demo

If you are using a Chromium v89+ based browser, you can try out the [webhid demo](https://SuperFlyTV.github.io/xkeys/).

## API documentation

### Events

```javascript
// Example:
xkeysPanel.on('down', (btnIndex, metadata) => {
	console.log('Button pressed', btnIndex, metadata)
})
```

| Event | Description |
| -- | --- |
| `"down"`, `"up"` | Triggered when a button is pressed/released. Emitted with `(btnIndex, metadata)`. |
| `"jog"`          | Triggered when the jog wheel is moved. Emitted with `(jogValue) |
| `"shuttle"`      | Triggered when the shuttle is moved. Emitted with `(shuttleValue)` |
| `"joystick"`     | Triggered when the joystick is moved. Emitted with `({x, y, z})` |
| `"tbar"`         | Triggered when the T-bar is moved. Emitted with `(tbarPosition, rawPosition)` |
| `"error"`        | Triggered on error. Emitted with `(error)`. |

### Methods

**Setting the backlight of a button**

```javascript
xkeysPanel.setBacklight(btnIndex, color)

// Examples:
// Set blue light
xkeysPanel.setBacklight(btnIndex, '0000ff')
// Set any available default light
xkeysPanel.setBacklight(btnIndex, true)
// Turn off light
xkeysPanel.setBacklight(btnIndex, false)
// Set flashing light
xkeysPanel.setBacklight(btnIndex, 'red', true)

// Set color (for RGB-supported devices)
xkeysPanel.setBacklight(btnIndex, 'ff3300')
```

**Set the indicator LEDs (the red/green status LED's)**

```javascript
xkeysPanel.setIndicatorLED(ledIndex, on, flashing)

// Examples:
// Light up the green LED
xkeysPanel.setIndicatorLED(1, true)
// Flash the red LED
xkeysPanel.setIndicatorLED(2, true, true)
```

**Set backlight intensity**

```javascript
xkeysPanel.setBacklightIntensity(intensity)

// Example:
// Set max intensity
xkeysPanel.setBacklightIntensity(255)
```

**Set all backlights on or off**

```javascript
xkeysPanel.setAllBacklights(color)

// Example:
// Light up all buttons
xkeysPanel.setAllBacklights(true)
// Light up all buttons in a nice color
xkeysPanel.setAllBacklights('ff33ff')
// Turn of all buttons
xkeysPanel.setAllBacklights(false)
```

**Set flashing frequency**

```javascript
// The frequency can be set to 1-255, where 1 is fastest and 255 is the slowest.
// 255 is approximately 4 seconds between flashes.
xkeysPanel.setFrequency(frequency)

// Example:
// Set the frequency to a pretty fast flash
xkeysPanel.setFrequency(8)
```

** Set unit ID **

```javascript
// Sets the UID (unit Id) value in the X-keys hardware
// Note: This writes to the EEPROM, don't call this function too often, or you'll kill thEEPROM! (An EEPROM only support a few thousands of write operations.)
xkeysPanel.setUnitId(unitId)
```

** Save backlights **

```javascript
// Save the backlights (so they are restored to this after a power cycle).
// Note: This writes to the EEPROM, don't call this function too often, or you'll kill thEEPROM! (An EEPROM only support a few thousands of write operations.)
xkeysPanel.saveBackLights()
```

#### Other functionality

See [the XKeys-class](packages/core/src/xkeys.ts) for more functionality.

### Supported devices

Thanks to official support from [P.I Enginneering, the X-keys manufacturer](https://xkeys.com/), there is support for all official (and some experimental) devices.

See the full list in [products.ts](packages/core/src/products.ts).

## Migrations

### 2.0.0

Version `2.0.0` is a breaking changes, which requires several changes in how to use the library.

The most notable changes are:

| Before, `<2.0.0`                                     | Changes in `>=2.0.0` |
| -- | -- |
| `let myXkeys = new XKeys()`                          | `let myXkeys = await XKeys.setupXkeysPanel()` |
| `myXkeys.on('down', (btnIndex) => {} )`              | The numbering of `btnIndexes` has changed:<br/>_ The PS-button is on index 0.<br/>_ Other buttons start on index 1.<br/>\* Numbering of buttons have changed for some models. |
| `myXkeys.on('downKey', (btnIndex) => {} )`           | Use `.on('down')` instead |
| `myXkeys.on('upKey', (btnIndex) => {} )`             | Use `.on('up')` instead   |
| `myXkeys.on('downAlt', (btnIndex) => {} )`           | Use `.on('down')` instead (PS-button is on index 0) |
| `myXkeys.on('upAlt', (btnIndex) => {} )`             | Use `.on('up')` instead (PS-button is on index 0)   |
| `myXkeys.on('jog', (position) => {} )`               | `myXkeys.on('jog', (index, position) => {} )`  |
| `myXkeys.on('shuttle', (position) => {} )`           | `myXkeys.on('shuttle', (index, position) => {} )` |
| `myXkeys.on('tbar', (position, rawPosition) => {} )` | `myXkeys.on('tbar', (index, position) => {} )` |
| `myXkeys.on('joystick', (position) => {} )`          | `myXkeys.on('joystick', (index, position) => {} )` |
| `myXkeys.setBacklight(...)`                          | Arguments have changed, see docs  |
| `myXkeys.setAllBacklights(...)`                      | Arguments have changed, see docs  |
| `myXkeys.setLED(index, ...)`                         | `myXkeys.setIndicatorLED(index, ...)` (index 1 = the red, 2 = the green one)  |

### 2.1.1

Version `2.1.1` has a minor change for when stopping the XKeysWatcher instance:
```
const watcher = new XKeysWatcher()
await watcher.stop() // Now returns a promise
```

## For developers

This is a mono-repo, using [Lerna](https://github.com/lerna/lerna) and [Yarn](https://yarnpkg.com).

To set up you local system for developing this repo:

- Install Yarn: `npm install -g yarn`
- Install all dependencies: `yarn`

### Contribution guidelines

If you have any questions or want to report a bug, [please open an issue at Github](https://github.com/SuperFlyTV/xkeys/issues/new).

If you want to contribute a bug fix or improvement, we'd happily accept Pull-requests.
(If you're planning something big, [please open an issue](https://github.com/SuperFlyTV/xkeys/issues/new) to announce it first, and spark discussions.

### Coding style and tests

Please follow the same coding style as the rest of the repository when you type.

Before committing, be sure to run `yarn lint` and `yarn test` to ensure your code passes the linting and unit tests.

### License

By contributing, you agree that your contributions will be licensed under its MIT License.

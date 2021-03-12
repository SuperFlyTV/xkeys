# xkeys

[![CircleCI](https://circleci.com/gh/SuperFlyTV/xkeys.svg?style=svg)](https://circleci.com/gh/SuperFlyTV/xkeys)

A Node.js module to interact with the [X-keys panels](https://xkeys.com/xkeys.html).

Licence: MIT

The project is based on the documentation available here: http://xkeys.com/PISupport/DeveloperHIDDataReports.php

## Installation

```
$ npm install --save xkeys
```

## BREAKING CHANGES

Please note that version `>=2.0.0` is a BREAKING CHANGE, as most of the API have changed.
If you're upgrading from `<2.0.0`, plase read the docs carefully.

## Getting started

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

	// Listen to pressed keys:
	xkeysPanel.on('down', (keyIndex, metadata) => {
		console.log('Key pressed ', keyIndex, metadata)

		// Light up a button when pressed:
		xkeysPanel.setBacklight(keyIndex, 'red')
	})
	// Listen to released keys:
	xkeysPanel.on('up', (keyIndex, metadata) => {
		console.log('Key released', keyIndex, metadata)

		// Turn off button light when released:
		xkeysPanel.setBacklight(keyIndex, false)
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
// watcher.stop()
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

		xkeysPanel.on('down', (keyIndex, metadata) => {
			console.log('Key pressed', keyIndex, metadata)
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

## Documentation

### Events

| Event            | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- | --- |
| `"down"`, `"up"` | Triggered when a button is pressed/released. Emitted with `(keyIndex, metadata)`. |     |
| `"jog"`          | Triggered when the jog wheel is moved. Emitted with `(jogValue)`                  |
| `"shuttle"`      | Triggered when the shuttle is moved. Emitted with `(shuttleValue)`                |
| `"joystick"`     | Triggered when the joystick is moved. Emitted with `({x, y, z})`                  |
| `"tbar"`         | Triggered when the T-bar is moved. Emitted with `(tbarPosition, rawPosition)`     |
| `"error"`        | Triggered on error. Emitted with `(error)`.                                       |

### Setting things

#### Set backlight of a button

```javascript
xkeysPanel.setBacklight(keyIndex, color)

// Examples:
// Set blue light
xkeysPanel.setBacklight(keyIndex, '0000ff')
// Set any available default light
xkeysPanel.setBacklight(keyIndex, true)
// Turn off light
xkeysPanel.setBacklight(keyIndex, false)
// Set flashing light
xkeysPanel.setBacklight(keyIndex, 'red', true)

// Set color (for RGB-supported devices)
xkeysPanel.setBacklight(keyIndex, 'ff3300')
```

#### Set the LEDs (the red/green status LED's)

```javascript
xkeysPanel.setIndicatorLED(ledIndex, on, flashing)

// Examples:
// Light up the green LED
xkeysPanel.setIndicatorLED(1, true)
// Flash the red LED
xkeysPanel.setIndicatorLED(2, true, true)
```

#### Set backlight intensity

```javascript
xkeysPanel.setBacklightIntensity(intensity)

// Example:
// Set max intensity
xkeysPanel.setBacklightIntensity(255)
```

#### Set all backlights on or off

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

#### Set flashing frequency

```javascript
// The frequency can be set to 1-255, where 1 is fastest and 255 is the slowest.
// 255 is approximately 4 seconds between flashes.
xkeysPanel.setFrequency(frequency)

// Example:
// Set the frequency to a pretty fast flash
xkeysPanel.setFrequency(8)
```

#### Other functionality

See [src/xkeys.ts](src/xkeys.ts) for more functionality.

### Supported devices

Thanks to official support from [P.I Enginneering, the X-keys manufacturer](https://xkeys.com/), there is support for all official (and some experimental) devices.

See the full list in [src/products.ts](src/products.ts)

# xkeys

[![CircleCI](https://circleci.com/gh/SuperFlyTV/xkeys.svg?style=svg)](https://circleci.com/gh/SuperFlyTV/xkeys)

A NodeJS module to interact with the [X-keys panels](https://xkeys.com/xkeys.html).

Licence: MIT

The project is based on the documentation available here: http://xkeys.com/PISupport/DeveloperHIDDataReports.php

## Installation

```
$ npm install --save xkeys
or
$ yarn add xkeys
```



## Getting started

### JavaScript

```javascript
const { XKeys } = require('xkeys')

// Connect to an x-keys panel:
var myXkeysPanel = new XKeys()

// Listen to pressed keys:
myXkeysPanel.on('down', keyIndex => {
	console.log('Key pressed: ' + keyIndex)

	// Light up a button when pressed:
	myXkeysPanel.setBacklight(keyIndex, true)
})
// Listen to released keys:
myXkeysPanel.on('up', keyIndex => {
	console.log('Key released: ' + keyIndex)

	// Turn off button light when released:
	myXkeysPanel.setBacklight(keyIndex, false)
})

// Listen to jog wheel changes:
myXkeysPanel.on('jog', deltaPos => {
	console.log('Jog position has changed: ' + deltaPos)
})
// Listen to shuttle changes:
myXkeysPanel.on('shuttle', shuttlePos => {
	console.log('Shuttle position has changed: ' + shuttlePos)
})
// Listen to joystick changes:
myXkeysPanel.on('joystick', position => {
	console.log('Joystick has changed:' + position) // {x, y, z}
})
// Listen to t-bar changes:
myXkeysPanel.on('tbar', (position, rawPosition) => {
    console.log('T-bar position has changed: ' + position + ' (uncalibrated: ' + rawPosition + ')')
})
```

## Documentation

### Initalize
#### Connect to any connected X-keys panel
```javascript
const XKeys = require('xkeys')

var myXkeysPanel = new XKeys()
```
#### Connect to a specific X-keys panel
```javascript
const HID = require('node-hid')
const XKeys = require('xkeys')

const devices = HID.devices()
const connectedXKeys = devices.filter(device => {
	return (device.vendorId === XKeys.vendorId && device.interface === 0) // Make sure that the interface-property is set to 0
})

if (connectedXKeys.length) {
	var myXkeysPanel = new XKeys(connectedXKeys[0].path)
} else {
	console.log("Could not find any connected X-keys panels.")
}
```

### Events

| Event | Description |
|---|---|
| `"down"`, `"up"` | Triggered when ANY button is pressed/released. Emitted with `(keyIndex)`. |
| `"downKey"`, `"upKey"` | Triggered when a regular button is pressed/released. Emitted with `(keyIndex)`. |
| `"downAlt"`, `"upAlt"` | Triggered when an alternative button is pressed/released, such as the "program switch" (keyIndex "PS"). Emitted with `(keyIndex)`. |
| `"jog"` | Triggered when the jog wheel is moved. Emitted with `(jogValue)` |
| `"shuttle"` | Triggered when the shuttle is moved. Emitted with `(shuttleValue)` |
| `"joystick"` | Triggered when the joystick is moved. Emitted with `({x, y, z})` |
| `"tbar"` | Triggered when the T-bar is moved. Emitted with `(tbarPosition, rawPosition)` |
| `"error"` | Triggered on error. Emitted with `(error)`. |


### Setting things
#### Set backlight of a button
```javascript
myXkeysPanel.setBacklight(keyIndex, on, redLight, flashing);

// Examples:
// Light up the backlight of bank 1 (blue light)
myXkeysPanel.setBacklight(keyIndex, true);
// Flash the backlight of bank 2 (red light)
myXkeysPanel.setBacklight(keyIndex, true, true, true);
```

#### Set the LEDs (the red/green status LED's)
```javascript
myXkeysPanel.setLED(keyIndex, on, flashing)

// Examples:
// Light up the green LED
myXkeysPanel.setBacklight(0, true);
// Light up the red LED
myXkeysPanel.setBacklight(1, true);
```

#### Set backlight intensity
```javascript
myXkeysPanel.setBacklightIntensity(intensity)

// Example:
// Set max intensity
myXkeysPanel.setBacklightIntensity(255)
```

#### Set all backlights on or off
```javascript
myXkeysPanel.setAllBacklights(on, redLight)

// Example:
// Light up all buttons
myXkeysPanel.setAllBacklights(true, false)
myXkeysPanel.setAllBacklights(true, true)
```

#### Set flashing frequency
```javascript
// The frequency can be set to 1-255, where 1 is fastest and 255 is the slowest.
// 255 is approximately 4 seconds between flashes.
myXkeysPanel.setFrequency(frequency)

// Example:
// Set the frequency to a pretty fast flash
myXkeysPanel.setFrequency(8)
```


## Device support

Testing and contributions are much appreciated!
If you have one of the untested devices below, please test it and tell us how it works in an Issue!

### Supported devices
These devices have been tested to work:

* XK-24
* XK-60
* XK-80
* XK-68 Jog + Shuttle
* XK-12 Jog
* XKE-124 T-bar

### Not tested devices (yet)

Support for these devices is implemented, but not tested:

* XK-4: Not tested
* XK-8: Not tested
* XK-16: Not tested
* XK-12 Joystick: Not tested
* XR-32: Not tested
* XKE-128: Not tested

If you have access to any of the untested devices listed above, it would be very nice if you could provide some data to add to the tests!
Just do
```
npm install
npm run logHMI
```
and [post an issue](https://github.com/SuperFlyTV/xkeys/issues) with the results in the generated file **log.txt**.

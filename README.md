# xkeys

An Nodejs/NPM module to interact with the X-keys panels.

Disclaimer: This module is very young and should not be used in production yet!

Licence: MIT

The project is based on the documentation available here: http://xkeys.com/PISupport/DeveloperHIDDataReports.php

## Installation

`$ npm install --save xkeys`



## Getting started

### JavaScript

```javascript

const XKeys = require('xkeys');

var myXkeysPanel = new XKeys();

// Listen to pressed keys:
myXkeysPanel.on('down', keyIndex => {
	console.log('Key pressed: '+keyIndex);
	myXkeysPanel.setBacklight(keyIndex, true);
});
// Listen to released keys:
myXkeysPanel.on('up', keyIndex => {
	console.log('Key released: '+keyIndex);

	myXkeysPanel.setBacklight(keyIndex, false);
});

// --- Experimental functions ---
// The functions below are implemented, but not tested with any hardware yet.
//

myXkeysPanel.on('jog', deltaPos => {
	console.log('Jog position has changed: '+deltaPos);
});
myXkeysPanel.on('shuttle', shuttlePos => {
	console.log('Shuttle position has changed: '+shuttlePos);
});
myXkeysPanel.on('joystick', position => {
	console.log('Joystick has changed:'+position); // {x, y, z}
});

```

## Documentation

### Initalize
#### Connect to any connected X-keys panel
```javascript
const XKeys = require('xkeys');

var myXkeysPanel = new XKeys();
```
#### Connect to a specific X-keys panel
```javascript
const HID = require('node-hid');
const XKeys = require('xkeys');

const devices = HID.devices();
const connectedXKeys = devices.filter(device => {
	return (device.vendorId === XKeys.vendorId && device.usage === 1); // Make sure that the usage-property is set to 1
});

if (connectedXKeys.length) {
	var myXkeysPanel = new XKeys(connectedXKeys[0].path);
} else {
	console.log("Could not find any connected X-keys panels.");
}

```

### Listeners

* 'downKey' & 'upKey': Triggered when a regular button is pressed/released. Emitted with (keyIndex).
* 'downAlt' & 'upAlt': Triggered when an alternative button is pressed/released, such as the "program switch" (keyIndex 'PS'). Emitted with (keyIndex).
* 'down' & 'up': Triggered when ANY button is pressed/released. Emitted with (keyIndex).

* 'jog': Triggered when the jog wheel is moved. Emitted with (jogValue) (the value may vary between -128 - 127). [UNTESTED]
* 'shuttle': Triggered when the shuttle is moved. Emitted with (shuttleValue) (the value may vary between -128 - 127). [UNTESTED]
* 'joystick': Triggered when the joystick is moved. Emitted with ({x, y, z}) (the values may vary between -128 - 127). [UNTESTED]


### Setting things
#### Set backlight of a button
```javascript
.setBacklight(keyIndex, on, redLight, flashing);

// Examples:
// Light up the backlight of bank 1 (blue light)
.setBacklight(keyIndex, true);
// Flash the backlight of bank 2 (red light)
.setBacklight(keyIndex, true, true, true);
```

#### Set the LEDs (the red/green status LED's)
```javascript
.setLED(keyIndex, on, flashing)

// Examples:
// Light up the green LED
.setBacklight(0, true);
// Light up the red LED
.setBacklight(1, true);
```

#### Set backlight intensity
```javascript
.setBacklightIntensity(intensity)

// Example:
// Set max intensity
.setBacklightIntensity(255)
```

#### Set all backlights on or off
```javascript
.setAllBacklights(on, redLight)

// Example:
// Light up all buttons
.setAllBacklights(true, false)
.setAllBacklights(true, true)
```

#### Set flashing frequency
```javascript
// The frequency can be set to 1-255, where 1 is fastest and 255 is the slowest.
// 255 is approximately 4 seconds between flashes.
.setFrequency(frequency)

// Example:
// Set the frequency to a pretty fast flash
.setFrequency(8)
```


## Device support

Testing and contributions are much appreciated!
If you have one of the untested devices below, please test it and tell us how it works in an Issue!

### Supported devices
These devices have been tested to work:

* XK-24
* XK-80
* XK-68 Jog + Shuttle

### Not tested devices (yet)

Support for these devices is implemented, but not tested:

* XK-60: Not tested
* XK-4: Not tested
* XK-8: Not tested
* XK-16: Not tested
* XK-12 Jog: Not tested
* XK-12 Joystick: Not tested
* XR-32: Not tested
* XKE-28: Not tested

If you have access to any of the untested devices listed above, it would be very nice if you could provide some data to add to the tests! Just run the **logHMI.js**-file  and [post an issue](https://github.com/SuperFlyTV/xkeys/issues) with the results in the generated file **log.txt**.

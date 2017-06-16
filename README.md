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

// Other functions:
// Set the LED of a key (Note)
// myXkeysPanel.setLED(keyIndex, on, flashing)

// myXkeysPanel.setBacklight(keyIndex, on, flashing)




// 
// --- Experimental functions ---
// The functions below are implemented, but NOT tested with hardware yet.
// 

myXkeysPanel.on('jog', deltaPos => {
	console.log('Jog position has changed: '+deltaPos);
});
myXkeysPanel.on('joystick', position => {
	console.log('Joystick has changed:'+position); // {x, y, z}
});

```

## Documentation
### Listeners

* 'downKey' & 'upKey': Triggered when a regular button is pressed/released. Emitted with (keyIndex).
* 'downAlt' & 'upAlt': Triggered when an alternative button is pressed/released, such as the "program switch" (keyIndex 'PS'). Emitted with (keyIndex).
* 'down' & 'up': Triggered when ANY button is pressed/released. Emitted with (keyIndex).

* 'jog': [UNTESTED] Triggered when the jog wheel is moved. Emitted with (jogValue) (the value may vary between -128 - 127).
* 'shuttle': [UNTESTED] Triggered when the shuttle is moved. Emitted with (shuttleValue) (the value may vary between -128 - 127).
* 'joystick': [UNTESTED] Triggered when the joystick is moved. Emitted with ({x, y, z}) (the values may vary between -128 - 127).





```javascript

myXkeysPanel.on('down', keyIndex => {
	console.log('Key pressed: '+keyIndex);
	myXkeysPanel.setBacklight(keyIndex, true);
});
```

### Setting lights
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
// Examples:
// Set max intensity
.setBacklightIntensity(255)
```

#### Set all backlights on or off
```javascript
.setAllBacklights(on, redLight)
// Examples:
// Light up all buttons
.setAllBacklights(true, false)
.setAllBacklights(true, true)
```

#### Set flashing frequency
```javascript
// the frequency can be set to 1-255, where 1 is fastest and 255 is the slowest. 255 is approximately 4 seconds between flashes.
.setFrequency(frequency)

// Examples:
// Set the frequency to a pretty fast flash
.setFrequency(8)
```




## Device support

Testing and contributions are much appreciated! 
If you have one of the untested devices below, please test it and tell us how it works in an Issue!

### Supported
These devices have been tested to work:

* XK-24

### Not tested (yet)

Support for these devices is implemented, but not tested:

* XK-60: Not tested
* XK-80: Not tested
* XK-4: Not tested
* XK-8: Not tested
* XK-16: Not tested
* XK-12 JOG: Not tested
* XK-12 JOYSTICK: Not tested
* XR-32: Not tested
* XKE-28: Not tested

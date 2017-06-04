# xkeys

An Nodejs/NPM module to interact with the X-keys panels.

Disclaimer: This module is very young and should not be used in production yet!

Licence: MIT

The project is based on the documentation available here: http://xkeys.com/PISupport/DeveloperHIDDataReports.php

## Installation

`$ npm install --save xkeys`



## Example

### JavaScript

```javascript

const XKeys = require('xkeys');

var myXkeysPanel = new XKeys();

myXkeysPanel.on('down',keyIndex => {
	console.log('key pressed: '+keyIndex);
	myXkeysPanel.setBacklight(keyIndex, true);
});

myXkeysPanel.on('up',keyIndex => {
	console.log('key released: '+keyIndex);

	myXkeysPanel.setBacklight(keyIndex, false);
});

myXkeysPanel.on('jog', deltaPos => {
	console.log('Jog position has changed: '+deltaPos);
});
myXkeysPanel.on('joystick', position => {
	console.log('Joystick has changed:'+position); // {x, y, z}
});
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

const HID = require('node-hid')
const { setupXkeysPanel, XKeys } = require('xkeys')

/*
	This example shows how to use node-hid to list all connected usb devices, then
	connecting to any supported X-keys panels.
*/

Promise.resolve().then(async () => {

	// List all connected usb devices:
	const devices = await HID.devicesAsync()

	for (const device of devices) {

		// Filter for supported X-keys devices:
		if (XKeys.filterDevice(device)) {

			console.log('Connecting to X-keys device:', device.product)

			setupXkeysPanel(device)
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
						console.log('Button pressed', keyIndex, metadata)
					})

					// ...
				})
				.catch(console.log) // Handle error

		} else {
			// is not an X-keys device
			console.log('Not a supported X-keys device:', device.product || device.productId)
		}

	}

}).catch(console.log)


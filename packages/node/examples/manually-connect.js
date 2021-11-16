const { setupXkeysPanel, listAllConnectedPanels } = require('xkeys')

/*
	This example shows how to use XKeys.setupXkeysPanel()
	directly, instead of going via XKeysWatcher()
*/

// Connect to an xkeys-panel:
setupXkeysPanel()
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

// List and connect to all xkeys-panels:
listAllConnectedPanels().forEach((connectedPanel) => {
	setupXkeysPanel(connectedPanel)
		.then((xkeysPanel) => {
			console.log(`Connected to ${xkeysPanel.info.name}`)

			xkeysPanel.on('down', (keyIndex, metadata) => {
				console.log('Button pressed ', keyIndex, metadata)

				// Light up a button when pressed:
				xkeysPanel.setBacklight(keyIndex, 'red')
			})
		})
		.catch(console.log) // Handle error
})

import { XKeys } from 'xkeys'

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

// List and connect to xkeys-panel:
XKeys.listAllConnectedPanels().forEach(() => {
	XKeys.setupXkeysPanel()
		.then((xkeysPanel) => {
			// ...
		})
		.catch(console.log) // Handle error
})

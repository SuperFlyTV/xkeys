import { requestXkeysPanels, XKeys, XKeysWatcher } from 'xkeys-webhid'

const connectedXkeys = new Set<XKeys>()

function appendLog(str: string) {
	const logElm = document.getElementById('log')
	if (logElm) {
		logElm.textContent = `${str}\n${logElm.textContent}`
	}
}

function initialize() {
	// Set up the watcher for xkeys:
	const watcher = new XKeysWatcher({
		// automaticUnitIdMode: false
		// usePolling: true,
		// pollingInterval= 1000
	})
	watcher.on('error', (e) => {
		appendLog(`Error in XkeysWatcher: ${e}`)
	})
	watcher.on('connected', (xkeys) => {
		connectedXkeys.add(xkeys)

		const id = xkeys.info.name

		appendLog(`${id}: Connected`)

		xkeys.on('disconnected', () => {
			appendLog(`${id}: Disconnected`)
			// Clean up stuff:
			xkeys.removeAllListeners()

			connectedXkeys.delete(xkeys)
			updateDeviceList()
		})
		xkeys.on('error', (...errs) => {
			appendLog(`${id}: X-keys error: ${errs.join(',')}`)
		})
		xkeys.on('down', (keyIndex: number) => {
			appendLog(`${id}: Button ${keyIndex} down`)
			xkeys.setBacklight(keyIndex, 'blue')
		})
		xkeys.on('up', (keyIndex: number) => {
			appendLog(`${id}: Button ${keyIndex} up`)
			xkeys.setBacklight(keyIndex, null)
		})
		xkeys.on('jog', (index, value) => {
			appendLog(`${id}: Jog #${index}: ${value}`)
		})
		xkeys.on('joystick', (index, value) => {
			appendLog(`${id}: Joystick #${index}: ${JSON.stringify(value)}`)
		})
		xkeys.on('shuttle', (index, value) => {
			appendLog(`${id}: Shuttle #${index}: ${value}`)
		})
		xkeys.on('tbar', (index, value) => {
			appendLog(`${id}: T-bar #${index}: ${value}`)
		})

		updateDeviceList()
	})
	window.addEventListener('load', () => {
		appendLog('Page loaded')

		if (!navigator.hid) {
			appendLog('>>>>>  WebHID not supported in this browser  <<<<<')
			return
		}
	})

	const consentButton = document.getElementById('consent-button')
	consentButton?.addEventListener('click', () => {
		// Prompt for a device

		appendLog('Asking user for permissions...')
		requestXkeysPanels()
			.then((devices) => {
				if (devices.length === 0) {
					appendLog('No device was selected')
				} else {
					for (const device of devices) {
						appendLog(`Access granted to "${device.productName}"`)
					}
					// Note The XKeysWatcher will now pick up the device automatically
				}
			})
			.catch((error) => {
				appendLog(`No device access granted: ${error}`)
			})
	})
}

function updateDeviceList() {
	// Update the list of connected devices:

	const container = document.getElementById('devices')
	if (container) {
		container.innerHTML = ''

		if (connectedXkeys.size === 0) {
			container.innerHTML = '<i>No devices connected</i>'
		} else {
			connectedXkeys.forEach((xkeys) => {
				const div = document.createElement('div')
				div.innerHTML = `
					<b>${xkeys.info.name}</b>
				`
				const button = document.createElement('button')
				button.innerText = 'Close device'
				button.addEventListener('click', () => {
					appendLog(xkeys.info.name + ' Closing device')
					xkeys.close().catch(console.error)
				})
				div.appendChild(button)

				container.appendChild(div)
			})
		}
	}
}

initialize()

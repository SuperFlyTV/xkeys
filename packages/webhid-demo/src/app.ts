import { getOpenedXKeysPanels, requestXkeysPanels, setupXkeysPanel, XKeys } from 'xkeys-webhid'

function appendLog(str: string) {
	const logElm = document.getElementById('log')
	if (logElm) {
		logElm.textContent = `${str}\n${logElm.textContent}`
	}
}

let currentXkeys: XKeys | null = null

async function openDevice(device: HIDDevice): Promise<void> {
	const xkeys = await setupXkeysPanel(device)

	currentXkeys = xkeys

	appendLog(`Connected to "${xkeys.info.name}"`)

	xkeys.on('disconnected', () => {
		appendLog(`${xkeys.info.name} was disconnected`)
		// Clean up stuff:
		xkeys.removeAllListeners()
	})
	xkeys.on('error', (...errs) => {
		appendLog('X-keys error:' + errs.join(','))
	})
	xkeys.on('down', (keyIndex: number) => {
		appendLog(`Button ${keyIndex} down`)
		xkeys.setBacklight(keyIndex, 'blue')
	})
	xkeys.on('up', (keyIndex: number) => {
		appendLog(`Button ${keyIndex} up`)
		xkeys.setBacklight(keyIndex, null)
	})
	xkeys.on('jog', (index, value) => {
		appendLog(`Jog #${index}: ${value}`)
	})
	xkeys.on('joystick', (index, value) => {
		appendLog(`Joystick #${index}: ${JSON.stringify(value)}`)
	})
	xkeys.on('shuttle', (index, value) => {
		appendLog(`Shuttle #${index}: ${value}`)
	})
	xkeys.on('tbar', (index, value) => {
		appendLog(`T-bar #${index}: ${value}`)
	})
}

window.addEventListener('load', () => {
	appendLog('Page loaded')
	// Attempt to open a previously selected device:
	getOpenedXKeysPanels()
		.then((devices) => {
			if (devices.length > 0) {
				appendLog(`"${devices[0].productName}" already granted in a previous session`)
				console.log(devices[0])
				openDevice(devices[0]).catch(console.error)
			}
		})
		.catch(console.error)
})

const consentButton = document.getElementById('consent-button')
consentButton?.addEventListener('click', () => {
	if (currentXkeys) {
		appendLog('Closing device')
		currentXkeys.close().catch(console.error)
		currentXkeys = null
	}
	// Prompt for a device

	appendLog('Asking user for permissions...')
	requestXkeysPanels()
		.then((devices) => {
			if (devices.length === 0) {
				appendLog('No device was selected')
				return
			}
			appendLog(`Access granted to "${devices[0].productName}"`)
			openDevice(devices[0]).catch(console.error)
		})
		.catch((error) => {
			appendLog(`No device access granted: ${error}`)
		})
})

const closeButton = document.getElementById('close-button')
closeButton?.addEventListener('click', () => {
	if (currentXkeys) {
		appendLog('Closing device')
		currentXkeys.close().catch(console.error)
		currentXkeys = null
	}
})

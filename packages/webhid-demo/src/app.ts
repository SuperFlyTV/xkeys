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

window.addEventListener('load', async () => {
	appendLog('Page loaded')

	// Attempt to open a previously selected device:
	const devices = await getOpenedXKeysPanels()
	if (devices.length > 0) {
		appendLog(`"${devices[0].productName}" already granted in a previous session`)
		console.log(devices[0])
		openDevice(devices[0]).catch(console.error)
	}
})

const consentButton = document.getElementById('consent-button')
consentButton?.addEventListener('click', async () => {
	if (currentXkeys) {
		appendLog('Closing device')
		await currentXkeys.close()
		currentXkeys = null
	}
	let devices: HIDDevice[]
	// Prompt for a device
	try {
		appendLog('Asking user for permissions...')
		devices = await requestXkeysPanels()
	} catch (error) {
		appendLog(`No device access granted: ${error}`)
		return
	}
	if (devices.length === 0) {
		appendLog('No device was selected')
		return
	}
	appendLog(`Access granted to "${devices[0].productName}"`)
	openDevice(devices[0]).catch(console.error)
})

const closeButton = document.getElementById('close-button')
closeButton?.addEventListener('click', async () => {
	if (currentXkeys) {
		appendLog('Closing device')
		await currentXkeys.close()
		currentXkeys = null
	}
})

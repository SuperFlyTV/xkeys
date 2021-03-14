import * as readline from 'readline'
import * as fs from 'fs'
import { promisify } from 'util'
import { HID_Device, XKeys, XKeysEvents } from '../'
import { describeEvent } from '../src/__tests__/lib'

const fsExists = promisify(fs.exists)
const fsWriteFile = promisify(fs.writeFile)

/*
 * This script is intended to be used by developers in order to verify that the functionality works and generate test scripts.
 * To run this script, run `ts-node scripts/record-test.ts` in a terminal.
 * The output recording is saved to /src/__tests__/recordings/ and should be committed to the repository.
 * To verify that the recording works in the unit tests, run `npm run unit`.
 */

console.log('=============================================')
console.log('  Test recorder for X-keys')
console.log('=============================================')

// Check if there is one (1) Xkeys panel connected:

const panels = XKeys.listAllConnectedPanels()

if (panels.length !== 1) {
	console.log('Make sure only one X-keys panel is plugged in, then restart this script!')
	console.log(`${panels.length} connected panels found:`)

	panels.forEach((device) => {
		console.log(`ProductId: ${device.productId}, Product: ${device.product}`)
	})

	process.exit(0)
} else {
	console.log(``)
	console.log(`Note: To quit this program, hit CTRL+C`)
	// console.log(``)

	// console.log(`Follow the instructions below:`)
	// console.log(`If anything looks wrong on the screen, abort the recording and report the issue.`)
	// console.log(``)

	startRecording(panels[0]).catch((err) => {
		console.log(err)
		process.exit(1)
	})
}

async function startRecording(panel: HID_Device) {
	const xkeys = await XKeys.setupXkeysPanel(panel)

	xkeys.setAllBacklights(false)
	xkeys.setIndicatorLED(0, false)
	xkeys.setIndicatorLED(1, false)

	console.log(``)
	console.log(`Step 1: Verify that the info below matches the panel you've connected:`)
	console.log(``)

	console.log(`Name of panel:      "${xkeys.info.name}"`)
	console.log(`Product id:         "${xkeys.info.productId}"`)
	console.log(`Unit id (UID):      "${xkeys.info.unitId}"`)

	console.log(`Number of rows:     ${xkeys.info.rowCount}`)
	console.log(`Number of columnts: ${xkeys.info.colCount}`)
	console.log(`Layout(s):`)
	xkeys.info.layout.forEach((layout) => {
		console.log(`  Name:     ${layout.name}`)
		console.log(`  Index:    ${layout.index}`)
		console.log(`  StartRow: ${layout.startRow}`)
		console.log(`  StartCol: ${layout.startCol}`)
		console.log(`  EndRow:   ${layout.endRow}`)
		console.log(`  EndCol:   ${layout.endCol}`)
		console.log(``)
	})

	console.log(`Has PS:         ${xkeys.info.hasPS}`)
	console.log(`Has Joystick:   ${xkeys.info.hasJoystick}`)
	console.log(`Has Jog:        ${xkeys.info.hasJog}`)
	console.log(`Has Shuttle:    ${xkeys.info.hasShuttle}`)
	console.log(`Has Tbar:       ${xkeys.info.hasTbar}`)
	console.log(`Has LCD:        ${xkeys.info.hasLCD}`)
	console.log(`Has GPIO:       ${xkeys.info.hasGPIO}`)
	console.log(`Has SerialData: ${xkeys.info.hasSerialData}`)
	console.log(`Has DMX:        ${xkeys.info.hasDMX}`)

	console.log(``)
	await askQuestion(`Does this look good? (click Enter to continue)`)
	console.log(``)

	const fileName = `${xkeys.info.productId}_${xkeys.info.name}.json`
	const path = `./src/__tests__/recordings/${fileName}`

	if (await fsExists(path)) {
		console.log(`Warning: Recording file "${path}" already exists!`)
		const answer = await askQuestion('Do you want to overwrite the file (Y/n)?')
		if (answer === 'n') {
			console.log(`Exiting!`)
			process.exit(0)
		}
	}

	// console.log(``)
	// console.log(`------ Starting recording ------`)
	// console.log(``)

	const recording: any = {
		device: {
			name: panel.product,
			productId: panel.productId,
		},
		info: xkeys.info,
		errors: [],
		actions: [],
		events: [],
	}

	const save = async () => {
		await fsWriteFile(path, JSON.stringify(recording, undefined, 2))
	}
	let triggerSaveRunning = false
	let triggerSaveRunAgain = false
	let triggerSaveTimeout: NodeJS.Timeout | null = null
	const triggerSave = () => {
		triggerSaveRunAgain = false
		if (triggerSaveRunning) triggerSaveRunAgain = true
		if (!triggerSaveTimeout) {
			triggerSaveTimeout = setTimeout(() => {
				triggerSaveTimeout = null
				triggerSaveRunning = true
				save()
					.then(() => {
						triggerSaveRunning = false
						if (triggerSaveRunAgain) triggerSave()
					})
					.catch((err) => {
						triggerSaveRunning = false
						if (triggerSaveRunAgain) triggerSave()
						console.log(err)
					})
			}, 100)
		}
	}
	triggerSave()

	// Intercept all data sent to the device:

	let bufferedWrites: Buffer[] = []

	// @ts-expect-error hack
	const orgWrite = xkeys.device.write
	// @ts-expect-error hack
	xkeys.device.write = function (data: number[]) {
		bufferedWrites.push(Buffer.from(data))
		return orgWrite(data)
	}
	const checkAction = async (xkeys: XKeys, question: string, method: string, args: any[]) => {
		// @ts-ignore
		xkeys[method](...args)

		const anomaly = await askQuestion(question)

		recording.actions.push({
			sentData: bufferedWrites.map((buf) => buf.toString('hex')),
			method,
			arguments: args,
			anomaly,
		})
		bufferedWrites = []
		triggerSave()
	}

	console.log(``)
	console.log(`Step 2: Don't touch anything on the panel just yet, first we're going to verify a few functionalities.`)

	console.log(`On the following questions, click Enter if OK, and write a message if something was off.`)

	console.log(``)
	await askQuestion(`Are you ready to start? (click Enter to continue)`)

	await checkAction(xkeys, `Did one of the LED indicator turn on?`, 'setIndicatorLED', [0, true])

	await checkAction(xkeys, `Did the LED indicator turn off?`, 'setIndicatorLED', [0, false])

	await checkAction(xkeys, `Did all button backlights turn on (all colors)?`, 'setAllBacklights', ['ffffff'])

	await checkAction(xkeys, `Did all button backlights turn blue?`, 'setAllBacklights', ['blue'])

	await checkAction(xkeys, `Did all button backlights turn off?`, 'setAllBacklights', [false])

	await checkAction(xkeys, `Did the first button light up blue?`, 'setBacklight', [1, '00f'])

	await checkAction(xkeys, `Did the first button light turn off?`, 'setBacklight', [1, '000'])

	// xkeys.toggleAllBacklights()
	// await askQuestion(`Did the light turn off?`)
	// logAction('toggleAllBacklights', [])

	// setBacklight
	// setAllBacklights
	// toggleAllBacklights
	// saveBackLights
	// setFrequency
	// setUnitId
	// writeLcdDisplay

	console.log(``)
	console.log(`-------------------------------------------`)
	console.log(`Done with initial checks!`)
	console.log(`-----`)
	console.log(``)
	console.log(`Step 3: Follow the instructions below:`)
	console.log(``)

	console.log(
		`Press (and release) the buttons and fiddle with all of the analogue inputs on the X-keys panel, one at a time.`
	)

	console.log(`For every action you do, check the following on the screen:`)
	console.log(`* The action description on the screen should match what you just did.`)
	console.log(
		`* (Buttons only) The button should light up in the following pattern: (Blue, Red, Green, White, Black/Off). On non-RGB panels, the lights will fall back to something equivalent.`
	)

	console.log(``)
	console.log(`If anything looks wrong on the screen, abort the recording and report the issue.`)

	console.log(``)
	console.log(`The recordings will be stored under ./src/__tests__/recordings/`)
	console.log(``)
	console.log(`When done, hit CTRL+C to exit the recording.`)

	let bufferedData: Buffer[] = []

	// @ts-ignore
	xkeys.device.on('data', (data) => {
		bufferedData.push(data)
	})

	xkeys.on('error', (err) => {
		recording.errors.push(err)
		triggerSave()
	})
	let colorLoop: any = undefined
	const handleEvent = (event: keyof XKeysEvents) => {
		xkeys.on(event, (...args: any[]) => {
			setImmediate(() => {
				const description = describeEvent(event, args)

				recording.events.push({
					data: bufferedData.map((buf) => buf.toString('hex')),
					description: description,
				})
				bufferedData = []
				console.log(description)

				if (event === 'down') {
					const keyIndex = args[0]
					colorLoop = doColorLoop(xkeys, keyIndex)
				} else if (event === 'up') {
					if (colorLoop) {
						colorLoop.stop()
						colorLoop = undefined
					}
				}
				triggerSave()
			})
		})
	}
	handleEvent('down')
	handleEvent('up')
	handleEvent('jog')
	handleEvent('shuttle')
	handleEvent('joystick')
	handleEvent('tbar')
	handleEvent('disconnected')
}

function askQuestion(query: string): Promise<string | number> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	return new Promise((resolve) =>
		rl.question(query, (ans: string | number) => {
			rl.close()
			resolve(ans)
		})
	)
}
function doColorLoop(xkeys: XKeys, keyIndex: number) {
	let active = true

	const doLoop = async () => {
		while (active) {
			xkeys.setBacklight(keyIndex, '0000ff')
			await waitTime(300)
			xkeys.setBacklight(keyIndex, '000000')
			await waitTime(200)
			if (!active) break

			xkeys.setBacklight(keyIndex, 'ff0000')
			await waitTime(300)
			xkeys.setBacklight(keyIndex, '000000')
			await waitTime(200)
			if (!active) break

			xkeys.setBacklight(keyIndex, '00ff00')
			await waitTime(300)
			xkeys.setBacklight(keyIndex, '000000')
			await waitTime(200)
			if (!active) break

			xkeys.setBacklight(keyIndex, 'ffffff')
			await waitTime(300)
			xkeys.setBacklight(keyIndex, '000000')
			await waitTime(200)
			if (!active) break

			xkeys.setBacklight(keyIndex, '000000')
			await waitTime(300)
			xkeys.setBacklight(keyIndex, '000000')
			await waitTime(200)

			await waitTime(1000)
		}
		xkeys.setBacklight(keyIndex, '000000')
	}

	doLoop().catch(console.log)

	return {
		stop: () => {
			active = false
		},
	}
}
function waitTime(time: number) {
	return new Promise((resolve) => setTimeout(resolve, time))
}

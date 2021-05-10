/*
 * This file contains internal convenience functions
 */

/** Convenience function to force the input to be of a certain type. */
export function literal<T>(o: T): T {
	return o
}

export function describeEvent(event: string, args: any[]): string {
	const metadataStr = (metadata: any) => {
		const strs: string[] = []
		Object.entries(metadata).forEach(([key, value]) => {
			strs.push(`${key}: ${value}`)
		})
		return strs.join(', ')
	}

	if (event === 'down') {
		const btnIndex = args[0]
		const metadata = args[1]
		return `Button ${btnIndex} pressed.  Metadata: ${metadataStr(metadata)}`
	} else if (event === 'up') {
		const btnIndex = args[0]
		const metadata = args[1]
		return `Button ${btnIndex} released. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'jog') {
		const index = args[0]
		const value = args[1]
		const metadata = args[2]
		return `Jog ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'shuttle') {
		const index = args[0]
		const value = args[1]
		const metadata = args[2]
		return `Shuttle ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'joystick') {
		const index = args[0]
		const value = JSON.stringify(args[1])
		const metadata = args[2]
		return `Joystick ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'tbar') {
		const index = args[0]
		const value = args[1]
		const metadata = args[2]
		return `T-bar ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'disconnected') {
		return `Panel disconnected!`
	}

	throw new Error('Unhnandled event!')
}

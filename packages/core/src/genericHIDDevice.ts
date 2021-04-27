/**
 * The expected interface for a HIDDevice.
 * This is to be implemented by any wrapping libraries to translate their platform specific devices into a common and simpler form
 */
export interface HIDDevice {
	on(event: 'error', handler: (data: any) => void): this
	on(event: 'data', handler: (data: Buffer) => void): this

	write(data: number[]): void

	close(): Promise<void>
}

export class GlobalDisconnectListener {
	private static listeners = new Map<HIDDevice, () => void>()
	private static isSetup = false

	/** Add listener for disconnect event, for a HIDDevice. The callback will be fired once. */
	static listenForDisconnect(device: HIDDevice, callback: () => void): void {
		this.setup()
		this.listeners.set(device, callback)
	}

	private static setup() {
		if (this.isSetup) return
		navigator.hid.addEventListener('disconnect', this.handleDisconnect)
		this.isSetup = true
	}
	private static handleDisconnect = (ev: HIDConnectionEvent) => {
		this.listeners.forEach((callback, device) => {
			if (device === ev.device) {
				callback()
				// Also remove the listener:
				this.listeners.delete(device)
			}
		})
		if (this.listeners.size === 0) {
			// If there are not listeners, we can teardown the global listener:
			this.teardown()
		}
	}
	private static teardown() {
		navigator.hid.removeEventListener('disconnect', this.handleDisconnect)
		this.listeners.clear()
		this.isSetup = false
	}
}

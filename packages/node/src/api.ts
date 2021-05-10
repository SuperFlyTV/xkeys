import type * as HID from 'node-hid'

/** HID.Device but with .path guaranteed */
export type HID_Device = HID.Device & { path: string }

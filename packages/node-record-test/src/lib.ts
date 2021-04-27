import * as fs from 'fs'
import { promisify } from 'util'

export const fsAccess = promisify(fs.access)
export const fsWriteFile = promisify(fs.writeFile)

export async function exists(path: string): Promise<boolean> {
	try {
		await fsAccess(path)
		return true
	} catch (err) {
		return false
	}
}

import { BackLightType, PRODUCTS } from '@xkeys-lib/core'

describe('products.ts', () => {
	test('productIds should be unique', async () => {
		const productIds = new Map<string, string>()
		for (const product of Object.values(PRODUCTS)) {
			for (const hidDevice of product.hidDevices) {
				const productId: number = hidDevice[0]
				const productInterface: number = hidDevice[1]

				const idPair = `${productId}-${productInterface}`
				// console.log('idPair', idPair)
				try {
					expect(productIds.has(idPair)).toBeFalsy()
				} catch (err) {
					console.log('productid', idPair, productIds.get(idPair))
					throw err
				}
				productIds.set(idPair, product.name)
			}
		}
	})
	test('verify integrity', async () => {
		for (const product of Object.values(PRODUCTS)) {
			try {
				expect(product.hidDevices.length).toBeGreaterThanOrEqual(1)

				if (product.backLightType === BackLightType.LEGACY) {
					expect(product.backLight2offset).toBeTruthy()
				}
			} catch (err) {
				console.log(`Error in product "${product.name}"`)
				throw err
			}
		}
	})
})

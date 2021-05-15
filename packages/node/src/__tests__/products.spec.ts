import { BackLightType, PRODUCTS } from '@xkeys-lib/core'

describe('products.ts', () => {
	test('productIds should be unique', async () => {
		const productIds = new Set<number>()
		for (const product of Object.values(PRODUCTS)) {
			for (const hidDevice of product.hidDevices) {
				const productId: number = hidDevice[0]
				// const interface: number = hidDevice[1]

				try {
					expect(productIds.has(productId)).toBeFalsy()
				} catch (err) {
					console.log('productid', productId)
					throw err
				}
				productIds.add(productId)
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

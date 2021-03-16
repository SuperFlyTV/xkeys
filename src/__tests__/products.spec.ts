import { PRODUCTS } from '../products'

describe('products.ts', () => {
	test('productIds should be unique', async () => {
		const productIds = new Set<number>()
		for (const product of Object.values(PRODUCTS)) {
			for (const productid of product.productId) {
				try {
					expect(productIds.has(productid)).toBeFalsy()
				} catch (err) {
					console.log('productid', productid)
					throw err
				}
				productIds.add(productid)
			}
		}
	})
})

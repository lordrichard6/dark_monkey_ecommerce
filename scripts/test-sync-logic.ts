
// Simulation of the ensureProductImages logic
const sync_variants = [
    {
        id: 12345,
        name: 'Unisex Hoodie / Carolina Blue / S',
        color: 'Carolina Blue',
        files: [
            {
                type: 'default',
                preview_url: 'https://files.cdn.printful.com/files/8ae/8ae1a8ec2b3ad7f7b4eaec7dd5e7eb3c_preview.png',
                thumbnail_url: 'https://files.cdn.printful.com/files/8ae/8ae1a8ec2b3ad7f7b4eaec7dd5e7eb3c_thumb.png'
            },
            {
                type: 'back',
                preview_url: 'https://files.cdn.printful.com/files/0a4/0a4c9900b4b4229ead3157bf9ecce13c_preview.png',
                thumbnail_url: 'https://files.cdn.printful.com/files/0a4/0a4c9900b4b4229ead3157bf9ecce13c_thumb.png'
            }
        ],
        product: {
            image: 'https://files.cdn.printful.com/image/blank-hoodie.jpg'
        }
    }
];

const productId = 'test-product-id';
const variantIdMap = new Map([[12345, 'uuid-12345']]);

function runSimulation() {
    const keepers = new Map();

    for (const sv of sync_variants) {
        const color = sv.color || null
        const allFiles = sv.files || []

        const previewFiles = allFiles.filter(f => f.type === 'preview' && (f.preview_url || f.thumbnail_url))
        const otherFiles = allFiles.filter(f =>
            (f.type === 'default' || f.type === 'back' || f.type === 'front' || f.type.includes('sleeve')) &&
            (f.preview_url || f.thumbnail_url) &&
            f.type !== 'preview'
        )

        if (previewFiles.length > 0) {
            for (const file of previewFiles) {
                const url = file.preview_url || file.thumbnail_url
                if (url) {
                    const key = `${url}::${color || 'null'}`
                    keepers.set(key, { url, color, printful_sync_variant_id: sv.id })
                }
            }
        } else if (otherFiles.length > 0) {
            console.log('Using otherFiles fallback');
            for (const file of otherFiles) {
                const url = file.preview_url || file.thumbnail_url
                if (url) {
                    const key = `${url}::${color || 'null'}`
                    console.log(`Adding key: ${key}`);
                    keepers.set(key, { url, color, printful_sync_variant_id: sv.id })
                }
            }
        } else {
            const catalogImage = sv.product?.image
            if (catalogImage) {
                const key = `${catalogImage}::${color || 'null'}`
                keepers.set(key, { url: catalogImage, color, printful_sync_variant_id: sv.id })
            }
        }
    }

    const result = Array.from(keepers.values());
    console.log('Final keepers count:', result.length);
    result.forEach(r => console.log(r));
}

runSimulation();

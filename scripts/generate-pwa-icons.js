const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputImage = path.join(__dirname, '../public/logo.png')
const outputDir = path.join(__dirname, '../public/icons')

// Create icons directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log('Created icons directory')
}

// Check if input image exists
if (!fs.existsSync(inputImage)) {
    console.error(`Error: Input image not found at ${inputImage}`)
    console.log('Please ensure logo.png exists in the public directory')
    process.exit(1)
}

console.log('Generating PWA icons...')
console.log(`Input: ${inputImage}`)
console.log(`Output: ${outputDir}`)
console.log('')

// Generate each icon size
Promise.all(
    sizes.map((size) =>
        sharp(inputImage)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
            .then(() => {
                console.log(`✓ Generated icon-${size}x${size}.png`)
                return size
            })
            .catch((err) => {
                console.error(`✗ Failed to generate ${size}x${size}:`, err.message)
                throw err
            })
    )
)
    .then((generatedSizes) => {
        console.log('')
        console.log(`Successfully generated ${generatedSizes.length} icons!`)
        console.log('Icons are ready for PWA use.')
    })
    .catch((err) => {
        console.error('')
        console.error('Icon generation failed:', err)
        process.exit(1)
    })

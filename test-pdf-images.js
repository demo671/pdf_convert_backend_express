/**
 * Test script to analyze a PDF and check for images
 * Run: node test-pdf-images.js path/to/your.pdf
 */

const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function analyzePDF(pdfPath) {
  console.log('\n========================================');
  console.log('PDF IMAGE ANALYZER');
  console.log('========================================\n');

  try {
    // Read PDF file
    console.log(`📄 Reading PDF: ${pdfPath}`);
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`✅ PDF loaded: ${pdfBuffer.length} bytes\n`);

    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    console.log(`📊 PDF has ${pages.length} page(s)\n`);

    let totalImagesFound = 0;

    // Analyze each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      console.log(`\n========== PAGE ${i + 1} ==========`);

      try {
        // Get resources
        const resourcesRef = page.node.get('Resources');
        console.log(`Resources ref exists: ${!!resourcesRef}`);

        if (!resourcesRef) {
          console.log('❌ No resources on this page');
          continue;
        }

        const resources = pdfDoc.context.lookup(resourcesRef);
        console.log(`Resources lookup successful: ${!!resources}`);

        if (!resources) {
          console.log('❌ Could not lookup resources');
          continue;
        }

        // List all resource keys
        const resourceKeys = resources.keys();
        console.log(`Resource keys: [${resourceKeys.join(', ')}]`);

        // Check XObject
        const xObjectRef = resources.get('XObject');
        console.log(`XObject ref exists: ${!!xObjectRef}`);

        if (!xObjectRef) {
          console.log('❌ No XObject in resources');
          continue;
        }

        const xObjects = pdfDoc.context.lookup(xObjectRef);
        console.log(`XObjects lookup successful: ${!!xObjects}`);

        if (!xObjects) {
          console.log('❌ Could not lookup XObjects');
          continue;
        }

        // List all XObjects
        const xObjectKeys = xObjects.keys();
        console.log(`XObject count: ${xObjectKeys.length}`);
        console.log(`XObject names: [${xObjectKeys.join(', ')}]`);

        // Check each XObject
        for (const key of xObjectKeys) {
          console.log(`\n  Checking XObject "${key}":`);

          try {
            const xObjectRef = xObjects.get(key);
            const xObject = pdfDoc.context.lookup(xObjectRef);

            if (!xObject) {
              console.log(`    ❌ XObject "${key}" is null`);
              continue;
            }

            // Get all properties
            const xObjKeys = xObject.keys ? xObject.keys() : [];
            console.log(`    Properties: [${xObjKeys.join(', ')}]`);

            // Check subtype
            const subtype = xObject.get('Subtype');
            const subtypeStr = subtype ? subtype.toString() : 'null';
            console.log(`    Subtype: ${subtypeStr}`);

            if (subtype && subtype.toString() === '/Image') {
              totalImagesFound++;
              console.log(`    ✅ THIS IS AN IMAGE! (${totalImagesFound})`);

              // Get image details
              const filter = xObject.get('Filter');
              const width = xObject.get('Width');
              const height = xObject.get('Height');
              const bitsPerComponent = xObject.get('BitsPerComponent');

              console.log(`    Filter: ${filter ? filter.toString() : 'none'}`);
              console.log(`    Width: ${width ? width.toString() : 'unknown'}`);
              console.log(`    Height: ${height ? height.toString() : 'unknown'}`);
              console.log(`    BitsPerComponent: ${bitsPerComponent ? bitsPerComponent.toString() : 'unknown'}`);

              // Try to get stream
              try {
                const stream = xObject.asStream();
                if (stream) {
                  const imageBytes = stream.getContents();
                  console.log(`    Stream size: ${imageBytes.length} bytes`);
                } else {
                  console.log(`    ⚠️ No stream data`);
                }
              } catch (streamErr) {
                console.log(`    ❌ Stream error: ${streamErr.message}`);
              }
            } else {
              console.log(`    ℹ️ Not an image (Subtype: ${subtypeStr})`);
            }
          } catch (xErr) {
            console.log(`    ❌ Error: ${xErr.message}`);
          }
        }
      } catch (pageErr) {
        console.log(`❌ Error on page ${i + 1}: ${pageErr.message}`);
      }
    }

    console.log('\n========================================');
    console.log('ANALYSIS COMPLETE');
    console.log('========================================');
    console.log(`Total images found: ${totalImagesFound}`);
    console.log('========================================\n');

    if (totalImagesFound === 0) {
      console.log('\n⚠️ NO IMAGES FOUND IN THIS PDF');
      console.log('\nPossible reasons:');
      console.log('1. PDF contains no images');
      console.log('2. Images are inline (not in XObject)');
      console.log('3. Images are in Form XObjects');
      console.log('4. Different PDF structure\n');
    } else {
      console.log(`\n✅ Found ${totalImagesFound} image(s) in this PDF!\n`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

// Get PDF path from command line
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.error('Usage: node test-pdf-images.js <path-to-pdf>');
  console.error('Example: node test-pdf-images.js ./uploads/document.pdf');
  process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
  console.error(`Error: File not found: ${pdfPath}`);
  process.exit(1);
}

analyzePDF(pdfPath);

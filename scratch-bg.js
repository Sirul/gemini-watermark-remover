import sharp from 'sharp';

async function removeWhiteBg(inputPath, outputPath) {
  try {
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // If it's pure white or very close to white
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0; // set alpha to 0
      }
    }

    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    })
      .png()
      .toFile(outputPath);
    console.log(`Processed ${inputPath} -> ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
  }
}

async function run() {
  await removeWhiteBg('public/icons/icon-192.png', 'public/icons/icon-192-trans.png');
  await removeWhiteBg('public/icons/icon-512.png', 'public/icons/icon-512-trans.png');
}

run();

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const svgPath = path.join(__dirname, '../assets/icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf-8');

// Tamaños para iOS
const iosSizes = [
  { size: 20, scale: 2, name: 'icon-20@2x.png' },
  { size: 20, scale: 3, name: 'icon-20@3x.png' },
  { size: 29, scale: 2, name: 'icon-29@2x.png' },
  { size: 29, scale: 3, name: 'icon-29@3x.png' },
  { size: 40, scale: 2, name: 'icon-40@2x.png' },
  { size: 40, scale: 3, name: 'icon-40@3x.png' },
  { size: 60, scale: 2, name: 'icon-60@2x.png' },
  { size: 60, scale: 3, name: 'icon-60@3x.png' },
  { size: 1024, scale: 1, name: 'icon-1024.png' },
];

// Tamaños para Android (en dp, luego multiplicamos por densidad)
const androidSizes = {
  'mipmap-mdpi': 48,    // 1x
  'mipmap-hdpi': 72,    // 1.5x
  'mipmap-xhdpi': 96,   // 2x
  'mipmap-xxhdpi': 144, // 3x
  'mipmap-xxxhdpi': 192, // 4x
};

function generateIcon(size, outputPath) {
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });
  
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  // Crear directorio si no existe
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`✓ Generado: ${outputPath} (${size}x${size})`);
}

// Generar iconos para iOS
console.log('Generando iconos para iOS...');
const iosIconDir = path.join(__dirname, '../ios/AppRecordatoriosMobile/Images.xcassets/AppIcon.appiconset');
iosSizes.forEach(({ size, scale, name }) => {
  const actualSize = size * scale;
  const outputPath = path.join(iosIconDir, name);
  generateIcon(actualSize, outputPath);
});

// Generar iconos para Android
console.log('\nGenerando iconos para Android...');
const androidBaseDir = path.join(__dirname, '../android/app/src/main/res');
Object.entries(androidSizes).forEach(([folder, size]) => {
  const outputDir = path.join(androidBaseDir, folder);
  const outputPath = path.join(outputDir, 'ic_launcher.png');
  const outputPathRound = path.join(outputDir, 'ic_launcher_round.png');
  
  generateIcon(size, outputPath);
  generateIcon(size, outputPathRound);
});

console.log('\n¡Todos los iconos han sido generados exitosamente!');


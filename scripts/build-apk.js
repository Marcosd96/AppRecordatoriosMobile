/**
 * Compila el APK de Android y lo copia a releases/. Funciona en Windows y en Linux/macOS
 * (npm ejecuta los scripts con cmd en Windows, que no entiende `./gradlew`).
 *
 * Uso: node scripts/build-apk.js release|debug
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const variant = process.argv[2];
if (variant !== 'release' && variant !== 'debug') {
  console.error('Uso: node scripts/build-apk.js release|debug');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
// Ruta absoluta: cmd puede estar configurado para no buscar en el directorio actual
const gradlew = path.join(root, 'android', isWindows ? 'gradlew.bat' : 'gradlew');

function run(command, args, cwd) {
  // En Windows hace falta el shell para ejecutar .bat y npx. Se le pasa una sola línea (los
  // argumentos son fijos de este script); la ruta va entre comillas por si tiene espacios
  const result = isWindows
    ? spawnSync([`"${command}"`, ...args].join(' '), { cwd, stdio: 'inherit', shell: true })
    : spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (variant === 'debug') {
  // El APK de depuración lleva el bundle dentro para funcionar sin Metro
  run(
    'npx',
    [
      'react-native', 'bundle',
      '--platform', 'android',
      '--dev', 'false',
      '--entry-file', 'index.js',
      '--bundle-output', 'android/app/src/main/assets/index.android.bundle',
      '--assets-dest', 'android/app/src/main/res',
    ],
    root,
  );
}

const androidDir = path.join(root, 'android');
if (variant === 'release') {
  run(gradlew, ['--no-configure-on-demand', 'generateCodegenArtifactsFromSchema'], androidDir);
}
run(gradlew, [variant === 'release' ? 'assembleRelease' : 'assembleDebug'], androidDir);

const apkName = `app-${variant}.apk`;
const source = path.join(root, '.build', 'app', 'outputs', 'apk', variant, apkName);
const target = path.join(root, 'releases', variant === 'release' ? 'Gesaccol.apk' : 'Gesaccol-debug.apk');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log(`APK generado en: ${path.relative(root, target)}`);

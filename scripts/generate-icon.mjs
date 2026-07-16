import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const buildDir = path.join(rootDir, "build");
const sourceSvgPath = path.join(buildDir, "icon.svg");
const pngPath = path.join(buildDir, "icon.png");
const icoPath = path.join(buildDir, "icon.ico");

await mkdir(buildDir, { recursive: true });

await sharp(sourceSvgPath)
  .resize(512, 512)
  .png()
  .toFile(pngPath);

const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngBuffers = await Promise.all(
  sizes.map((size) =>
    sharp(sourceSvgPath)
      .resize(size, size)
      .png()
      .toBuffer(),
  ),
);

const icoBuffer = await pngToIco(pngBuffers);
await writeFile(icoPath, icoBuffer);

console.log(`Generated icon assets:\n- ${pngPath}\n- ${icoPath}`);

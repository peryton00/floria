const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const imageExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.heic', '.heif', '.ico']);
const ignoreDirs = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.gemini', 'brain', 'scratch', 'tools']);

// 1. Helper to read PNG / JPEG dimensions from binary buffer
function getDimensions(filePath, ext) {
  try {
    const buf = fs.readFileSync(filePath);
    if (ext === '.png') {
      if (buf.length >= 24 && buf.toString('hex', 0, 8) === '89504e470d0a1a0a') {
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        return { width, height };
      }
    } else if (ext === '.jpg' || ext === '.jpeg') {
      let offset = 2;
      while (offset < buf.length) {
        const marker = buf.readUInt16BE(offset);
        if (marker >= 0xffc0 && marker <= 0xffc3) {
          const height = buf.readUInt16BE(offset + 5);
          const width = buf.readUInt16BE(offset + 7);
          return { width, height };
        }
        offset += 2 + buf.readUInt16BE(offset + 2);
      }
    } else if (ext === '.svg') {
      const str = buf.toString('utf8');
      const viewBoxMatch = str.match(/viewBox=["']\s*0\s+0\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i);
      if (viewBoxMatch) {
        return { width: Math.round(parseFloat(viewBoxMatch[1])), height: Math.round(parseFloat(viewBoxMatch[2])) };
      }
      const wMatch = str.match(/width=["'](\d+)(?:px)?["']/i);
      const hMatch = str.match(/height=["'](\d+)(?:px)?["']/i);
      if (wMatch && hMatch) {
        return { width: parseInt(wMatch[1], 10), height: parseInt(hMatch[1], 10) };
      }
    }
  } catch (e) {
    // ignore
  }
  return { width: null, height: null };
}

// Format bytes helper
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 2. Discover all physical image assets
let imageFiles = [];
function walkImages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) walkImages(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (imageExts.has(ext)) {
        const stats = fs.statSync(fullPath);
        const dims = getDimensions(fullPath, ext);

        // Classification
        let classification = 'UNKNOWN';
        let targetClassification = 'REVIEW_MANUALLY';

        if (relPath.startsWith('floria-svg-icon-system/')) {
          classification = 'ICON';
          targetClassification = 'KEEP_IN_REPOSITORY';
        } else if (relPath.includes('favicon') || relPath.includes('logo') || relPath.includes('next.svg') || relPath.includes('vercel.svg') || relPath.includes('globe.svg') || relPath.includes('file.svg') || relPath.includes('window.svg')) {
          if (relPath.includes('floria-logo.png')) {
            classification = 'LOGO';
            targetClassification = 'KEEP_IN_REPOSITORY';
          } else {
            classification = 'APPLICATION_ASSET';
            targetClassification = 'KEEP_IN_REPOSITORY';
          }
        } else if (relPath.includes('cat-')) {
          classification = 'CATEGORY_IMAGE';
          targetClassification = 'MIGRATE_TO_SUPABASE_STORAGE';
        } else if (relPath.includes('nursery-')) {
          classification = 'NURSERY_IMAGE';
          targetClassification = 'MIGRATE_TO_SUPABASE_STORAGE';
        } else if (relPath.includes('hero-plants')) {
          classification = 'BANNER';
          targetClassification = 'MIGRATE_TO_SUPABASE_STORAGE';
        }

        imageFiles.push({
          relPath,
          filename: entry.name,
          ext,
          sizeBytes: stats.size,
          formattedSize: formatBytes(stats.size),
          width: dims.width,
          height: dims.height,
          isVector: ext === '.svg',
          format: ext === '.svg' ? 'Vector (SVG)' : (ext === '.ico' ? 'Icon (ICO)' : 'Raster (' + ext.replace('.', '').toUpperCase() + ')'),
          classification,
          targetClassification,
          absPath: fullPath,
          references: []
        });
      }
    }
  }
}
walkImages(rootDir);

// 3. Scan all source code files for references
let references = [];
let unsplashRefs = [];
let sourceFilesScanned = 0;

function scanSourceFile(filePath) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  sourceFilesScanned++;

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;

    // Check Unsplash
    if (line.toLowerCase().includes('unsplash.com')) {
      const matches = line.match(/(https?:\/\/[^\s"'`>)]*unsplash\.com[^\s"'`>)]*)/gi);
      if (matches) {
        matches.forEach(url => {
          unsplashRefs.push({
            file: relPath,
            line: lineNo,
            url: url.replace(/;$/, '').replace(/,$/, ''),
            rawLine: line.trim()
          });
        });
      }
    }

    // Check physical file references
    imageFiles.forEach(img => {
      const baseName = img.filename;
      if (line.includes(baseName)) {
        img.references.push({ file: relPath, line: lineNo });
        references.push({
          sourceFile: relPath,
          line: lineNo,
          exactReference: baseName,
          targetAsset: img.relPath,
          type: 'Local File Reference',
          isLocal: true,
          rawLine: line.trim()
        });
      }
    });

    // Check general image tags / attributes
    if (line.includes('<Image') || line.includes('<img') || line.includes('logo_url') || line.includes('image_url') || line.includes('document_url') || line.includes('avatar_url')) {
      const srcMatch = line.match(/(src|href|url|logo_url|image_url|avatar_url|document_url)=["']([^"']+)["']/i);
      if (srcMatch && !line.includes(srcMatch[2])) {
        // already recorded
      }
    }
  });
}

function walkSource(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) walkSource(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.css', '.md', '.html'].includes(ext)) {
        scanSourceFile(fullPath);
      }
    }
  }
}
walkSource(rootDir);

// Update isReferenced flag
imageFiles.forEach(img => {
  img.isReferenced = img.references.length > 0;
});

console.log('Processed:', imageFiles.length, 'images across', sourceFilesScanned, 'source files.');
console.log('Unsplash references found:', unsplashRefs.length);
console.log('Total local references found:', references.length);

// Save results
const auditDir = path.join(rootDir, 'tools/image-audit');
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

// 1. JSON
const inventoryJson = imageFiles.map(img => ({
  relPath: img.relPath,
  filename: img.filename,
  ext: img.ext,
  sizeBytes: img.sizeBytes,
  formattedSize: img.formattedSize,
  width: img.width,
  height: img.height,
  format: img.format,
  isVector: img.isVector,
  classification: img.classification,
  targetClassification: img.targetClassification,
  isReferenced: img.isReferenced,
  referenceCount: img.references.length,
  references: img.references
}));
fs.writeFileSync(path.join(auditDir, 'image-inventory.json'), JSON.stringify(inventoryJson, null, 2));

// 2. CSV
let csvLines = ['Repository Path,Filename,Format,File Size (Bytes),File Size (Formatted),Width,Height,Classification,Is Referenced,Reference Count,Target Recommendation'];
imageFiles.forEach(img => {
  csvLines.push(`"${img.relPath}","${img.filename}","${img.format}",${img.sizeBytes},"${img.formattedSize}",${img.width || ''},${img.height || ''},"${img.classification}",${img.isReferenced},${img.references.length},"${img.targetClassification}"`);
});
fs.writeFileSync(path.join(auditDir, 'image-inventory.csv'), csvLines.join('\n'));

console.log('Generated image-inventory.json and image-inventory.csv');

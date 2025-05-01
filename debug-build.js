// debug-build.js
const fs = require('fs');
const path = require('path');

console.log('===== DEBUG BUILD PROCESS =====');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('✓ dist directory exists');
  
  // List files in dist directory
  const files = fs.readdirSync(distPath);
  console.log(`Found ${files.length} files in dist directory:`);
  files.forEach(file => {
    console.log(` - ${file}`);
  });
  
  // Check for main.js specifically
  if (files.includes('main.js')) {
    console.log('✓ main.js exists in dist directory');
    const mainJsStats = fs.statSync(path.join(distPath, 'main.js'));
    console.log(`   Size: ${mainJsStats.size} bytes`);
    console.log(`   Last modified: ${mainJsStats.mtime}`);
  } else {
    console.log('✕ main.js does not exist in dist directory');
  }
} else {
  console.log('✕ dist directory does not exist');
}

// Check package.json scripts
try {
  const packageJson = require('./package.json');
  console.log('\nPackage.json Scripts:');
  console.log(` - build: ${packageJson.scripts.build}`);
  console.log(` - start: ${packageJson.scripts.start}`);
} catch (err) {
  console.log('Error reading package.json:', err);
}

console.log('\n===== END DEBUG =====');
#!/usr/bin/env node

// bump-versions.js
// Usage: node bump-versions.js <new-version>
// Example: node bump-versions.js 1.2.3

const fs = require('fs');
const path = require('path');

function findPackageJsonFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      // Only recurse into packages and examples folders
      // or their subfolders, skip node_modules and others
      if (
        file === 'packages' ||
        file === 'examples' ||
        dir.includes('packages') ||
        dir.includes('examples')
      ) {
        // skip node_modules
        if (file !== 'node_modules') {
          results = results.concat(findPackageJsonFiles(filePath));
        }
      }
    } else if (file === 'package.json') {
      // Only add if in packages/** or examples/**
      if (
        filePath.includes(path.sep + 'packages' + path.sep) ||
        filePath.includes(path.sep + 'examples' + path.sep)
      ) {
        results.push(filePath);
      }
    }
  });
  return results;
}

function bumpVersions(newVersion) {
  const root = process.cwd();
  const files = findPackageJsonFiles(root);
  files.forEach(file => {
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Bumped ${file} to version ${newVersion}`);
  });
}

if (require.main === module) {
  const newVersion = process.argv[2];
  if (!newVersion) {
    console.error('Usage: node bump-versions.js <new-version>');
    process.exit(1);
  }
  bumpVersions(newVersion);
}

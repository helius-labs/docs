#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixLinksInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix internal markdown links that should point to Chinese versions
  // Match pattern: ](...) where ... starts with / but not /zh/, /images/, /logo/, http, https, mailto
  const linkPattern = /\]\(\/(?!zh\/|images\/|logo\/|favicon|http|mailto)([^)]+)\)/g;
  
  content = content.replace(linkPattern, (match, linkPath) => {
    changed = true;
    return `](/zh/${linkPath})`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed links in: ${filePath.replace(process.cwd(), '.')}`);
  }
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      fixLinksInFile(fullPath);
    }
  }
}

// Process all MDX files in zh/ directory
const zhDir = path.join(process.cwd(), 'zh');
if (fs.existsSync(zhDir)) {
  console.log('🔗 Fixing internal links in Chinese documentation...');
  processDirectory(zhDir);
  console.log('✅ Link fixing complete!');
} else {
  console.log('⚠️ No zh/ directory found');
}

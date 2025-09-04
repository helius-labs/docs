#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixLinksInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix internal markdown links that should point to Chinese versions
  // Match pattern: ](...) where ... starts with / but not /zh/, /images/, /logo/, http, https, mailto
  const markdownLinkPattern = /\]\(\/(?!zh\/|images\/|logo\/|favicon|http|mailto)([^)]+)\)/g;
  
  content = content.replace(markdownLinkPattern, (match, linkPath) => {
    changed = true;
    return `](/zh/${linkPath})`;
  });

  // Fix JSX href attributes that should point to Chinese versions  
  // Match pattern: href="/..." where ... doesn't start with zh/, images/, logo/, http, https, mailto
  const hrefPattern = /href="\/(?!zh\/|images\/|logo\/|favicon|http|mailto)([^"]+)"/g;
  
  content = content.replace(hrefPattern, (match, linkPath) => {
    changed = true;
    return `href="/zh/${linkPath}"`;
  });

  // Fix openapi frontmatter references that should point to Chinese versions
  // Match pattern: openapi: /... where ... doesn't start with zh/, images/, logo/, http, https
  const openapiPattern = /^openapi:\s+\/(?!zh\/|images\/|logo\/|favicon|http|mailto)([^\s]+)/gm;
  
  content = content.replace(openapiPattern, (match, apiPath) => {
    changed = true;
    return `openapi: /zh/${apiPath}`;
  });

  // Fix openapi frontmatter references that are missing leading slash
  // Match pattern: openapi: openapi/... (without leading slash)
  const openapiNoSlashPattern = /^openapi:\s+(?!\/|zh\/|images\/|logo\/|favicon|http|mailto)(openapi\/[^\s]+)/gm;
  
  content = content.replace(openapiNoSlashPattern, (match, apiPath) => {
    changed = true;
    return `openapi: /zh/${apiPath}`;
  });

  // Fix openapi frontmatter references that already have zh/ but missing leading slash
  // Match pattern: openapi: zh/openapi/... 
  const openapiZhNoSlashPattern = /^openapi:\s+zh\/(openapi\/[^\s]+)/gm;
  
  content = content.replace(openapiZhNoSlashPattern, (match, apiPath) => {
    changed = true;
    return `openapi: /zh/${apiPath}`;
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
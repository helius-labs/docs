#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common English to Chinese anchor mappings (based on actual analysis)
const anchorMappings = {
  // Billing & Plans
  'pricing-plans': '定价计划',
  'credit-system': '信用系统', 
  'rate-limits': '速率限制',
  'enterprise': '企业计划',
  'legacy-plans': '旧版计划',
  'getting-started': '快速开始',
  
  // Common sections
  'overview': '概述',
  'best-practices': '最佳实践',
  'examples': '示例',
  'parameters': '参数',
  'response': '响应',
  'common-use-cases': '常见用例',
  'developer-tips': '开发者提示',
  'quick-start': '快速入门',
  'getting-your-rpc-url': '获取您的RPC端点',
  
  // RPC Methods
  'account-&-balance-methods': '账户与余额方法',
  'transaction-methods': '交易方法', 
  'block-&-slot-methods': '区块与槽方法',
  'network-&-cluster-methods': '网络与集群方法',
  
  // DAS API
  'fetching-individual-assets': 'API方法',
  'fetching-asset-collections': 'API方法',
  'advanced-query-methods': 'API方法',
  'fungible-tokens': '处理特殊资产类型',
  'compressed-nfts': '处理特殊资产类型',
  'inscriptions--spl-20': '处理特殊资产类型',
  'off-chain-data': '处理特殊资产类型',
  
  // Enhanced Transactions
  'parse-individual-transactions': '概述',
  'fetch-transaction-history-for-an-address': '概述',
  
  // Airship
  'using-the-web-version': '使用网页版',
  'using-the-cli-version': '使用CLI版',
  
  // Other common
  'transaction-optimization': '交易优化',
  'data-retrieval-optimization': '数据检索优化', 
  'real-time-monitoring': '实时监控'
};

function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '') // Keep alphanumeric, Chinese chars, spaces, hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

function extractHeadings(content) {
  const headings = [];
  const headingPattern = /^#{1,6}\s+(.+)$/gm;
  let match;
  
  while ((match = headingPattern.exec(content)) !== null) {
    const headingText = match[1].trim();
    const slug = createSlug(headingText);
    headings.push({
      text: headingText,
      slug: slug
    });
  }
  
  return headings;
}

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

  // Extract available headings in this file
  const availableHeadings = extractHeadings(content);

  // Fix anchor links using mappings and available headings
  const anchorPattern = /href="(#[^"]+)"/g;
  
  content = content.replace(anchorPattern, (match, anchorLink) => {
    const anchorId = anchorLink.substring(1); // Remove the #
    
    // First try direct mapping
    if (anchorMappings[anchorId]) {
      const chineseSlug = createSlug(anchorMappings[anchorId]);
      changed = true;
      return `href="#${chineseSlug}"`;
    }
    
    // Try URL decoded version (for %26 -> &)
    const decodedAnchorId = decodeURIComponent(anchorId);
    if (anchorMappings[decodedAnchorId]) {
      const chineseSlug = createSlug(anchorMappings[decodedAnchorId]);
      changed = true;
      return `href="#${chineseSlug}"`;
    }
    
    // Then try intelligent matching with available headings
    for (const heading of availableHeadings) {
      // Match common patterns
      if (heading.text.includes('定价') && anchorId.includes('pricing')) {
        changed = true;
        return `href="#${heading.slug}"`;
      }
      if (heading.text.includes('信用') && anchorId.includes('credit')) {
        changed = true;
        return `href="#${heading.slug}"`;  
      }
      if (heading.text.includes('速率') && anchorId.includes('rate')) {
        changed = true;
        return `href="#${heading.slug}"`;
      }
      if (heading.text.includes('企业') && anchorId.includes('enterprise')) {
        changed = true;
        return `href="#${heading.slug}"`;
      }
      if (heading.text.includes('开始') && (anchorId.includes('start') || anchorId.includes('getting'))) {
        changed = true;
        return `href="#${heading.slug}"`;
      }
      if (heading.text.includes('概述') && anchorId.includes('overview')) {
        changed = true;
        return `href="#${heading.slug}"`;
      }
      if (heading.text.includes('最佳实践') && anchorId.includes('best-practices')) {
        changed = true;
        return `href="#${heading.slug}"`;
      }
    }
    
    return match; // Return unchanged if no mapping found
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
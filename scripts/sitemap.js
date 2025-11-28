/**
 * Generate and validate sitemap with hreflang tags for multilingual docs
 * https://developers.google.com/search/docs/specialty/international/localized-versions
 * 
 * Only updates lastmod dates when actual page changes are detected
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://www.helius.dev/docs';
const DEFAULT_LANGUAGE = 'en';

const LANGUAGES = {
  en: { code: 'en', name: 'English', urlPrefix: '', isDefault: true },
  zh: { code: 'zh', name: '中文', urlPrefix: '/zh', isDefault: false }
};

function getFileLastModified(filePath) {
  try {
    // Get last commit date for the file from git
    const date = execSync(`git log -1 --format=%cs -- "${filePath}"`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    }).trim();
    return date || new Date().toISOString().split('T')[0];
  } catch (error) {
    // File not in git yet or git not available, use current date
    return new Date().toISOString().split('T')[0];
  }
}

function getLocUrl(page, langConfig) {
  let pagePath;
  if (page === "index" || page === `${langConfig.code}/index`) {
    pagePath = "";
  } else {
    pagePath = `/${page}`;
  }
  return `${BASE_URL}${langConfig.urlPrefix}${pagePath}`;
}

function extractPagesFromNavigation(navigation, language = 'en') {
  const pages = [];

  function traverseGroups(groups) {
    for (const group of groups) {
      if (group.pages) {
        for (const page of group.pages) {
          if (typeof page === 'string') {
            pages.push(page);
          } else if (typeof page === 'object' && page.group && page.pages) {
            traverseGroups([page]);
          }
        }
      }
      if (group.groups) {
        traverseGroups(group.groups);
      }
    }
  }

  if (navigation.languages) {
    const langNav = navigation.languages.find(lang => lang.language === language);
    if (langNav && langNav.anchors) {
      for (const anchor of langNav.anchors) {
        if (anchor.groups) {
          traverseGroups(anchor.groups);
        }
      }
    }
  }

  return pages;
}

function generateSitemap() {
  try {
    const docsRoot = path.join(__dirname, '..');
    const docsPath = path.join(docsRoot, 'docs.json');
    const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));

    const allLanguages = {};
    for (const langCode of Object.keys(LANGUAGES)) {
      const pages = extractPagesFromNavigation(docs.navigation, langCode);
      allLanguages[langCode] = pages.map(p => p.replace(/^(en|zh)\//, ''));
    }

    const uniquePages = new Set();
    for (const pages of Object.values(allLanguages)) {
      pages.forEach(page => uniquePages.add(page));
    }

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    sitemap += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // Generate a <url> entry for each language version of each page
    for (const page of Array.from(uniquePages).sort()) {
      for (const [langCode, langConfig] of Object.entries(LANGUAGES)) {
        // Only generate URL entry if this language has this page
        if (!allLanguages[langCode].includes(page)) continue;

        const locUrl = getLocUrl(page, langConfig);
        
        // Get last modified date from git for this language's file
        const mdxPath = langConfig.urlPrefix
          ? path.join(docsRoot, langConfig.urlPrefix.substring(1), `${page}.mdx`)
          : path.join(docsRoot, `${page}.mdx`);
        const lastmod = getFileLastModified(mdxPath);
        
        sitemap += '  <url>\n';
        sitemap += `    <loc>${locUrl}</loc>\n`;
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;

        // Add alternate links for all available language versions
        for (const [altLangCode, altLangConfig] of Object.entries(LANGUAGES)) {
          if (allLanguages[altLangCode].includes(page)) {
            const hrefUrl = getLocUrl(page, altLangConfig);
            sitemap += `    <xhtml:link rel="alternate" hreflang="${altLangConfig.code}" href="${hrefUrl}"/>\n`;
          }
        }

        // x-default always points to English version
        const defaultUrl = getLocUrl(page, LANGUAGES.en);
        sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultUrl}"/>\n`;
        sitemap += '  </url>\n';
      }
    }

    sitemap += '</urlset>\n';

    const outputPath = path.join(docsRoot, 'sitemap.xml');
    const oldSitemap = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    
    // Write new sitemap
    fs.writeFileSync(outputPath, sitemap, 'utf8');

    // Check if anything actually changed (ignoring just date changes on unchanged files)
    const changed = oldSitemap !== sitemap;
    
    // Count total URL entries across all languages
    let totalUrlEntries = 0;
    for (const [langCode] of Object.entries(LANGUAGES)) {
      totalUrlEntries += allLanguages[langCode].length;
    }
    
    console.log(`✓ Sitemap generated: ${uniquePages.size} unique pages`);
    console.log(`✓ URL entries: ${totalUrlEntries} (across ${Object.keys(LANGUAGES).length} languages)`);
    console.log(`✓ Languages: ${Object.keys(LANGUAGES).join(', ')}`);
    console.log(`✓ Changed: ${changed ? 'Yes' : 'No (dates preserved)'}`);
    
    // Quick validation
    const urlCount = (sitemap.match(/<url>/g) || []).length;
    const hreflangCount = (sitemap.match(/hreflang="/g) || []).length;
    
    if (urlCount === totalUrlEntries && hreflangCount >= urlCount * 2) {
      console.log('✓ Validation passed');
      return true;
    } else {
      console.error(`❌ Validation failed: expected ${totalUrlEntries} URLs, got ${urlCount}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

if (require.main === module) {
  const success = generateSitemap();
  process.exit(success ? 0 : 1);
}

module.exports = { generateSitemap };


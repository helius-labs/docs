# Helius Documentation

Comprehensive developer documentation for Helius APIs and services. Built with Mintlify and supporting multiple languages.

## Features

- Multi-language support (English, Chinese)
- Custom sitemap with hreflang tags for SEO
- API reference documentation
- Comprehensive guides and tutorials
- Interactive code examples

## Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally. To install, use the following command

```
npm i -g mintlify
```

Run the following command at the root of your documentation (where docs.json is)

```
mintlify dev
```

## Internationalization

We use [Lingo.dev](https://lingo.dev) for translation management:

```bash
# Prepare and run translations
npm run i18n

# Generate translations (force update)
npm run i18n:force
```

## SEO & Sitemap

We maintain a custom sitemap with hreflang tags for optimal international SEO. The sitemap is **automatically regenerated** after translations via GitHub Actions.

```bash
# Generate sitemap manually (if needed)
npm run sitemap
```

The sitemap regenerates automatically when:
- Translations run via GitHub Actions
- You can also run manually after adding/removing pages

## Available Scripts

- `npm run dev` - Start Mintlify development server
- `npm run i18n` - Run translation workflow
- `npm run sitemap` - Generate sitemap.xml with hreflang tags

### Publishing Changes

Install our Github App to auto propagate changes from your repo to your deployment. Changes will be deployed to production automatically after pushing to the default branch. Find the link to install on your dashboard.

#### Troubleshooting

- Mintlify dev isn't running - Run `mintlify install` it'll re-install dependencies.
- Page loads as a 404 - Make sure you are running in a folder with `docs.json`

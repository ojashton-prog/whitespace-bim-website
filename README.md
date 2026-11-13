# Whitespace BIM website

Home page for Whitespace BIM: BIM modelling and coordination for data centres.

## Structure

- `index.html` – the site (single page, no build step). Open it in a browser, or host it on GitHub Pages, Netlify or Vercel.
- `assets/images/` – images used on the page (original images plus generated renders).
- `renders/` – the code that generates the data-centre renders (three.js, rendered headless with Playwright).
- `docs/` – PDF export of the home page.

## Regenerating the renders

```bash
cd renders
npm install three@0.149.0 playwright
mkdir -p out3d
node render3d.js hall:real plantfloor:real chillerdeck:real generators:real
```

Styles: `real` (grey, services in blue/orange/green), `site` (white with palette), `colour`, `grey`.

## Placeholders still to fill

- Contact email (`[hello@whitespace.com]`)
- City in the footer (`[City]`)

Confidential project imagery is deliberately not stored in this repository.

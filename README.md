# Whitespace BIM website

Home page for Whitespace BIM: BIM modelling and coordination for building services.

## Structure

- `index.html` – the site (single page, no build step). Open it in a browser, or host it on GitHub Pages, Netlify or Vercel.
- `assets/images/` – images used on the page (original images plus generated renders).
- `assets/logo/` – logo marks: `mark-3d.png` (3D pipework render) and `mark-flat.svg` (flat unit with risers).
- `renders/` – the code that generates the data-centre renders (three.js, rendered headless with Playwright).
- `docs/` – PDF export of the home page.

## Regenerating the renders

```bash
cd renders
npm install three@0.149.0 playwright
mkdir -p out3d
node render3d.js hall:realfront plantfloor:realfront chillerdeck:realfront generators:realfront
node renderlogo.js   # 3D logo mark
```

Styles: `realfront` (current: grey, low corner view, services in blue/orange/green), `real` (grey, services in blue/orange/green), `site` (white with palette), `colour`, `grey`.

## Placeholders still to fill

- Contact email (the contact section is currently removed)
- City in the footer (`[City]`)

Confidential project imagery is deliberately not stored in this repository.

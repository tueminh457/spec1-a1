# Pass the Mic – SDG 5 Generative Art and Webpage
Version 1.0 · 15 November 2026 · COMM2754 Assignment 1 (26t3)

## Usage notes
A webpage about SDG 5 (Gender Equality) and the Guterres quote "The central question of gender equality is a question of power."
The generative painting (p5.js) is the fixed background of the page. It is painted once on load (this takes a few seconds) and is
different on every visit: one of three palettes (aqua, antique rose + celadon, antique blue + blush) and a new random composition.
Use the "Weave a new cloth" button, or refresh, for a new painting.
The page colours follow the palette of the painting. To lock a palette while testing, set `RB_FORCE_THEME` (0, 1 or 2) at the top of `sketch.js`.

## Installation instructions
Unzip the folder, start a web server in the `code` directory and open `index.html` in a browser (Chrome, Edge or Firefox recommended).
No dependencies or plug-in installation are required (p5.js is included in `js/`).
```bash
python -m http.server 8000      # then open http://localhost:8000
```

## Files
- `index.html` – page structure and all text content
- `css/style.css` – shan shui styling (paper veils, mist ridge, seal)
- `sketch.js` – the generative painting (p5.js). Lines marked `WEBPAGE` are the only changes made to embed it in the page
- `js/site.js` – date, scroll reveal, reload button
- `js/p5.js`, `js/addons/p5.sound.min.js` – libraries

## Documentation
See the design document in `design-documents`.

## License information
Released under the GPL 3.0 license. See the `LICENSE` file for details.

## Credits
Created by Nguyen Hoang Tue Minh for COMM2754, RMIT University Vietnam. p5.js is by the Processing Foundation (LGPL 2.1).
Contact: (add your email / website)

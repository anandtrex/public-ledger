# South Asian dynasties and regional states

One shared editorial registry feeds the chronology and animated map: **137 entries
and 143 reign periods**, from **413 BCE through 1947 CE**. The geographic mask
includes present-day India, Pakistan, Bangladesh, Nepal and Bhutan. It is not a
claim about historical nationality or disputed sovereignty. This is an expanded,
non-exhaustive selection of ruling houses, regional states, hereditary offices
and colonial administrations, not a complete atlas of every local ruler.

## Sources and files

- `source/dynasties.json`: curated names, reign periods, regions, Wikipedia links,
  notes and British paramountcy intervals.
- `sources.json` and `source/*.txt`: original URLs, retrieval dates and extracted
  research snapshots. Sources checked **13 November 2026**. Some provider pages
  blocked direct retrieval; search extracts supplement those pages. Extracts are
  not full HTML archives. Wikipedia extracts retain their source attribution and
  are subject to Wikipedia's CC BY-SA terms. Source facts and dates are curated,
  not a verbatim reproduction of article prose.
- `dynasties.json`: validated browser registry, clipped at 1947, including the
  longest continuous reign within the displayed period.
- `map-sources.json`: pinned source versions, URLs, licences and SHA-256 checksums.
- `source/cliopatria-matched.geojson.gz`: unmodified selected world source records,
  plus their original record indices, from Cliopatria v0.2.1, commit
  `5f433377139a6eeaeacbdc894b70f8805b72c8b5`. The full world archive is not needed
  for offline rebuilding. The manifest records its original checksum and URL.
- `source/natural-earth-countries.geojson.gz`: Natural Earth admin 0, 1:50m,
  v5.1.2, public domain. Used for context and clipping, not historical borders.
- `source/india-1941.geojsonl.gz`: India State Stories' digitized 1941 districts
  and princely states, via ramSeraph / Datameet's public historical release. The
  mirror carries CC0 terms. The original project describes representation-level
  digitization from the Census of India Administrative Atlas and cautions that
  it is not a survey-accuracy product. See the exact source and licence links in
  the manifest. `source/reference-matches.json` records explicit state matches.
- `source/schematic-cores.geojson`: editor-drawn location sketches around named
  centres in the linked histories. **These are not historical frontiers, maximum
  extents or confirmations of control over every place enclosed.** They appear
  as unfilled dashed outlines. They are never included in sourced-only mode.
- `source/map-matches.json`: explicit family/phase to source-polity matches.
- `source/ahom-1826.png`, `source/ahom-early-1500.jpg` and
  `source/ahom-map-trace.json`: additional Wikimedia extent references. The late
  map is by Chaipau, based on Taher (2001), CC BY-SA 3.0. Its shaded region is
  manually traced and approximately affine-georeferenced from three named towns.
  This is an uncertain late-period locator, not survey-grade geometry. The early
  map, by Ananya Taye (CC0), is a qualitative upper-valley reference. The exact
  image pages, author credits, checksums and modifications are in the manifest.
- `map.json`: clipped/simplified derived polygons, background and reference
  outlines. `map-coverage.json` counts available records per shared registry ID.

Chronology sources include Harvard's *A Timeline of South Asian History*, the
Met's *Heilbrunn Timeline of Art History*, Wikipedia and official local histories.
Date conventions sometimes differ. Individual notes distinguish selected phases,
nominal rulers, offices and claimant periods. Earlier regional entry choices were
reviewed against their sources during expansion. Do not treat every row as an
exclusive, independent nation or every phase as a distinct genealogy.

## Dates, visibility and authority

Units are historical years. Negative integers mean BCE, positive mean CE, with
**no year zero**. Plot coordinates add one to negative years, making 1 BCE and
1 CE adjacent. Endpoints are year-resolution anchors, not exact accession days.
Year 1947 includes transition-year observations. Nothing is displayed beyond it.
The map's 1947 frame depicts the eve of partition using source polygons for
1946, avoiding the source's post-partition residual British Raj geometry.

Chronology order defaults to start date across all regions. Region controls colour.
The short-reign toggle affects only the chronology. It is on initially. When off,
an entry is hidden only if **every continuous reign is under 50 years**. If one
reign reaches 50 years, all its reigns remain, including short restorations. This
preserves both Mughal phases and the short Ahom restoration. The map always
includes short-lived entries. Search, region and time-window filters are shared.
Clicking a short-lived map entry reveals its chronology row if needed.

British paramountcy includes **East India Company and Crown** authority. The
chronology splits bars at the entry's recorded transition date: dotted outlines
mark subordinate periods. The map applies dotted borders in those same periods.
This does not imply that all preceding rule was independent of every other power.
Nepal and Bhutan are not classified as British Indian princely states. Dotted
status is a political relationship, not evidence that a border is cartographically
certain. The uncertain-outline toggle remains relevant to princely states too.

## Geometry, uncertainty and overlaps

All browser resources are local. No map tiles, live providers, external fonts or
geographic services are requested at page load. Plotly's existing basic bundle
draws the local polygons using Cartesian longitude/latitude, with a fixed aspect
correction. It is an illustrative regional map, not a measurement projection.

Preparation repairs geometry, clips to the five-country mask, simplifies at
0.015 degrees and rounds to four decimal places. Tiny polygon remnants below
0.0001 square degrees are removed. Numerical precision does not imply matching
historical accuracy. EPSG:4326 coordinates and approximate reference points are
retained for reproducibility. No statistical indicator codes apply.

The map distinguishes:

1. Generalized, dated Cliopatria polygons, held over the source record's interval.
2. Dated reference footprints, including the 1941 states. When used outside their
   reference year they are approximate geographic locators, not reconstructed
   annual frontiers. Missing source intervals may use the nearest dated outline
   as a clearly marked reference, never as a confirmed boundary.
3. Unfilled schematic cores around documented centres.

Turning **Show uncertain / reference outlines** off removes cores, manual traces,
nearest-date substitutes and reference outlines outside their own date. Dated
1941 polygons remain in 1941. This is *sourced-only*, not an assertion that every
surviving historical reconstruction is confirmed or undisputed. Active names
remain listed even when their geometry is hidden. The chronology and map never
have independent dynasty registries or incompatible reign dates.

Imperial, nominal and regional authorities can coexist. A broader Maratha polygon
may describe both the Bhonsle imperial phase and the Peshwa office; Nepal's Shah
monarchy and Rana prime ministers also overlap. Regional/princely footprints are
drawn above broader footprints using opaque pale fills, avoiding misleading colour
blends. Cores are unfilled. Remaining outline intersections reflect source
uncertainty or layered authority, not two exclusive assignments of sovereignty.
Plain neutral land indicates unresolved coverage; there is no background hatch.
Do not infer that such areas were uninhabited or unruled.

Cliopatria is CC BY 4.0; the original Natural Earth layer is public domain; the
Ahom tracing adapts CC BY-SA 3.0 material. The combined derived map is distributed
under **CC BY-SA 4.0**, with attribution and changes disclosed in the page and
manifest. No Schwartzberg atlas maps are reproduced.

## Rebuild and check

```sh
python3 scripts/prepare-south-asian-dynasties.py
python3 -m venv /tmp/dynasty-map-venv
/tmp/dynasty-map-venv/bin/pip install -r scripts/requirements-dynasty-map.txt
/tmp/dynasty-map-venv/bin/python scripts/prepare-dynasty-map.py
node --check assets/js/south-asian-dynasties.js
node --check assets/js/dynasty-map.js
node scripts/check-south-asian-dynasties.cjs
node scripts/check-dynasty-map.cjs
bundle exec jekyll build
```

Preparation is offline after installing its pinned Python requirements. Research
and provider downloads are maintenance tasks. Preserve dated input snapshots and
record any new geometry's authorship, reference date and uncertainty. Controller
checks do not replace rendered browser inspection.

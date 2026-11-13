# Repository Guidelines

## Project Structure & Development

Public Ledger is a Jekyll site for politics, economy, and society, hosted on GitHub Pages. Pages live under section directories, reusable markup under `_layouts/` and `_includes/`, and CSS, JavaScript, and vendored libraries under `assets/`. Store downloadable dataset snapshots and their provenance in `data/<visualisation>/`. Use `_data/` for Jekyll template data and `scripts/` for offline preparation. Never edit generated `_site/` files.

Use `bundle install`, `bundle exec jekyll serve`, and `bundle exec jekyll build` for dependency installation, local preview, and production builds. Keep dependencies compatible with GitHub Pages. Use `relative_url` for local asset and page URLs so project subpaths work.

## Local Assets & Data

The browser must make no requests outside the site. Vendor plotting libraries, serve datasets locally, and avoid external fonts, CDNs, analytics, or live provider APIs. Ordinary source-attribution links are welcome. Downloads from providers belong to maintenance, not page loads.

Use the local Plotly.js basic bundle for charts. Record download dates, original URLs, indicator codes, units, coverage, exclusions, and transformations beside each dataset. Preserve source snapshots and make preparation reproducible. `python3 scripts/prepare-research-output.py` rebuilds the research-output JSON from the compressed OECD CSV and local spending snapshots.

Join observations by country code and exact year. Exclude aggregates and missing values rather than treating blanks as zero. Distinguish nominal current US dollars, PPP, constant prices, percentages, and fractional publication counts. Keep the World Bank's region labels, including “Latin America & Caribbean”.

## Chart Behaviour & Statistics

The income/R&D chart currently covers 2000–2023 and defaults to 2020. Exclude incomplete 2024 reporting. Keep axes fixed across years, tightly fitted to the displayed period with small margins. Each spending measure may have its own fixed range. When a linear y-axis includes zero, extend its lower bound slightly below zero so circles near the baseline are fully visible; size the padding for the markers and preserve the fixed range across years. This is display padding, not negative observations.

Use circles whose area represents total nominal GDP, with a fixed size scale across years and a minimum visible marker size. Avoid permanent country labels, numbers, diamonds, and leader arrows. Use a searchable country picker and point clicks to toggle dark outlines and horizontal spending guides. The income-group picker and PPP option were intentionally removed.

Use a single HTML tooltip for both text and background, with pointer events disabled and positioning constrained to the chart. Avoid duplicate markers and competing tooltip layers.

Trend lines are dotted and toggleable. Show them only when the unrounded R² is at least 0.5; suppress weaker or undefined fits in every chart. Whenever shown, display R² to three decimals in the legend. Calculate it using the same observations and transformed coordinates as the fitted line; identify logarithmic fits and handle undefined statistics. Do not imply causation or same-year research efficiency.

The output chart uses field-specific OECD indicators across 27 disciplines, while spending is national. Explain this mismatch, fractional counting, citation limitations, and publication/funding lags. Do not sum overlapping fields into a national total.

## Content & Homepage

Keep primary content visible immediately without requiring scrolling. Use compact headings, short introductions, and restrained padding on every page. The homepage should show actual post entries in the initial viewport, rather than a large hero. Charts and other main content should begin as high as practical. Avoid forced heading line breaks, oversized typography, tall empty sections, and redundant navigation links above the content. Let headings wrap naturally on narrow screens, and preserve readable controls and chart dimensions.

The homepage combines `site.posts` with standalone pages marked `listed: true`, sorted newest first. Listed pages need `date`, `section`, `title`, and `description`. Keep existing visualisation permalinks stable. Maintain the About page's disclosure of AI-assisted development and published data sources.

## Style, Checks & Contributions

Use lowercase, hyphenated filenames, readable Liquid, and scoped styles. Provide accessible controls, clear units, source notes, and non-color cues.

Run JavaScript syntax checks, relevant data/interaction checks, and the Jekyll build. Inspect affected browser interactions when access is available. A successful build does not verify hover behaviour or visual layout; report access limitations accurately.

Use focused commits with imperative subjects, such as `Add country spending guides`. Pull requests should explain changes, data sources, checks, and visual effects. Keep credentials and machine-specific configuration out of version control.

## Commit Protocol

When asked to commit, separate shared setup or infrastructure changes from page changes, and make a separate commit for each page or visualisation. Include each visualisation's own scripts, datasets, preparation code, and documentation with its page commit.

Other agents may be editing this workspace concurrently. Inspect Git status and diffs before staging, use explicit file lists or selected hunks, and include only your own changes. For shared files such as CSS, README, and section indexes, stage only the portions you authored. Never use blanket staging, overwrite another agent's work, or reset their index or working tree. An isolated index may help keep staging separate, but check for concurrent HEAD changes before committing. Leave unrelated changes uncommitted and report them clearly, including any of your small edits left within another agent's unfinished files. Run relevant checks before committing, and report the resulting commits and any remaining changes.

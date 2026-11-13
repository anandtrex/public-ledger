# Public Ledger

A Jekyll site for visualisations and explainers about the economy, society, and history. It is configured to use the Jekyll and plugin versions supported by GitHub Pages.

## Local development

Install Ruby and Bundler, then run:

```sh
bundle install
bundle exec jekyll serve
```

Open <http://localhost:4000>. Build the static site with `bundle exec jekyll build`; generated files go into `_site/`.

## GitHub Pages

In the repository’s **Settings → Pages**, select **Deploy from a branch**, then choose the publishing branch and `/ (root)` folder. GitHub Pages will build the site from the repository. If this is a project site, set `baseurl` in `_config.yml` to `/<repository-name>` before publishing. For a user or organization site, leave `baseurl` empty.

## Adding content

Add dated articles to `_posts/` using Jekyll’s `YYYY-MM-DD-title.md` naming pattern. Add standalone pages as Markdown with front matter. Keep datasets in `_data/` or beside the relevant visualisation, and document their source, units, date range, and limitations. Use `relative_url` for internal links and assets so the site works at both a domain root and a project subpath.

## Data visualisations

The income and R&D comparison at `/economy/income-and-research/` loads local snapshots of Our World in Data’s R&D CSV and the World Bank’s current-US-dollar GDP-per-capita data from `data/income-and-research/`. It plots only country/year pairs present in both sources, and coverage varies by year. Browser requests remain within the site. Keep source links, units, and exclusions visible whenever updating the chart.

The chart uses a vendored Plotly.js basic bundle in `assets/vendor/` (MIT license). The nominal GDP per capita chart has fixed axis ranges across years. Circle area represents total nominal GDP on a fixed size scale, with 2020 selected by default, and the trend checkbox controls an unweighted OLS fit against log10 GDP per capita. Data sources and snapshot dates are recorded in `data/income-and-research/README.md`. No external fonts, chart libraries, or data are requested by the browser.

The second chart at `/economy/research-spending-and-output/` compares national R&D spending with four OECD publication and citation metrics across 27 research fields. It uses `data/research-output/output.json`, prepared offline with `python3 scripts/prepare-research-output.py`. Its source, coverage, and interpretation are documented in `data/research-output/README.md`.

The homepage lists all `_posts/` entries and standalone pages with `listed: true`, sorted newest first. Listed pages need `date`, `section`, `title`, and `description` front matter. The two existing visualisations use this metadata and keep their original URLs.

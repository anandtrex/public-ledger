# Public Ledger

A Jekyll site for visualisations and explainers about politics, the economy, and society. It is configured to use the Jekyll and plugin versions supported by GitHub Pages.

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

The homepage lists all `_posts/` entries and standalone pages with `listed: true`, sorted newest first. Listed pages need `date`, `section`, `title`, and `description` front matter. The two existing visualisations use this metadata and keep their original URLs.

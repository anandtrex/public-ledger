---
layout: default
listed: true
section: History
date: 2026-11-13 12:00:00 +0000
title: South Asian dynasties through time
description: Explore overlapping dynasties that ruled territory within present-day India, Pakistan, Bangladesh, Nepal, and Bhutan.
permalink: /history/south-asian-dynasties/
---

<link rel="stylesheet" href="{{ '/assets/css/south-asian-dynasties.css' | relative_url }}">
<article class="dynasty-page">
  <header class="analysis-header">
    <p class="eyebrow">History · A regional chronology</p>
    <h1>South Asian dynasties through time</h1>
    <p class="dynasty-intro">Who ruled when? Explore selected dynasties and colonial regimes through 1947, with territory inside present-day India, Pakistan, Bangladesh, Nepal, or Bhutan. Overlapping bars show contemporaries, not territorial size.</p>
  </header>
  <section id="dynasty-explorer" class="chart-panel" aria-label="Explore the dynasty timeline">
    <div class="dynasty-controls">
      <label>Find a dynasty or place<input id="dynasty-search" type="search" placeholder="Try Chola, Bengal, Punjab…" disabled></label>
      <label>Region<select id="dynasty-region" disabled><option value="">All regions</option></select></label>
      <label>Period<select id="dynasty-era" disabled><option value="all">Full timeline</option><option value="ancient">413 BCE–600 CE</option><option value="medieval">600–1500 CE</option><option value="earlymodern">1500–1947 CE</option></select></label>
      <label>Order<select id="dynasty-sort" disabled><option value="time">Start date</option><option value="name">Name</option></select></label>
      <label class="dynasty-short-control"><input id="dynasty-short" type="checkbox" checked disabled> Show entries with all reigns under 50 years</label>
      <button id="dynasty-reset" type="button" disabled>Reset all</button>
    </div>
    <ul class="dynasty-region-key" aria-label="Region colours">
      <li>Northwest &amp; Indus</li><li>North &amp; Gangetic plain</li><li>Bengal &amp; Northeast</li><li>Deccan &amp; West</li><li>South &amp; East coast</li><li>British rule</li><li>Nepal &amp; Bhutan</li><li>Other colonial rule</li>
    </ul>
    <section class="dynasty-map-panel" aria-labelledby="dynasty-map-heading">
      <div class="dynasty-map-heading">
        <h2 id="dynasty-map-heading">Territories through time</h2>
        <output id="dynasty-map-date" for="dynasty-map-slider dynasty-map-year">413 BCE</output>
      </div>
      <div class="dynasty-map-controls">
        <button id="dynasty-map-play" type="button" aria-pressed="false" disabled>Play</button>
        <button id="dynasty-map-back" type="button" aria-label="Step back in time" disabled>← Back</button>
        <button id="dynasty-map-next" type="button" aria-label="Step forward in time" disabled>Next →</button>
        <label>Year <span class="dynasty-bce-hint">(− for BCE)</span><input id="dynasty-map-year" type="number" min="-413" max="1947" step="1" value="-413" disabled></label>
        <label>Years per step<select id="dynasty-map-step" disabled><option value="1">1</option><option value="10" selected>10</option><option value="25">25</option><option value="50">50</option></select></label>
        <label class="dynasty-map-checkbox"><input id="dynasty-map-names" type="checkbox" checked disabled> Show names</label>
        <label class="dynasty-map-checkbox"><input id="dynasty-map-uncertain" type="checkbox" checked disabled> Show uncertain / reference outlines</label>
      </div>
      <label class="dynasty-map-slider-label" for="dynasty-map-slider">Map year<input id="dynasty-map-slider" type="range" min="-412" max="1947" step="1" value="-412" aria-valuetext="413 BCE" disabled></label>
      <p id="dynasty-map-status" class="dynasty-map-status" role="status" aria-live="polite">Loading local historical boundaries…</p>
      <div class="dynasty-map-legend" aria-label="Boundary styles"><span>Generalized source boundary</span><span class="princely">Princely state: Company / Crown</span><span class="uncertain">Uncertain / reference outline</span></div>
      <div class="dynasty-map-grid">
        <div class="dynasty-map-wrap">
          <div id="dynasty-map-tooltip" class="dynasty-tooltip" role="tooltip" hidden></div>
          <div id="dynasty-map" role="img" aria-label="Historical territories of selected dynasties in the map year, clipped to the modern India, Pakistan, Bangladesh, Nepal and Bhutan area. Equivalent names and coverage are listed alongside."></div>
        </div>
        <div class="dynasty-map-list"><h3>Active in this year</h3><ul id="dynasty-map-active"></ul></div>
      </div>
      <p class="dynasty-map-note">Approximate territories from <a href="https://github.com/Seshat-Global-History-Databank/cliopatria">Cliopatria</a>, clipped to the modern India/Pakistan/Bangladesh/Nepal/Bhutan area. Thin grey outlines give modern geographic context. Dotted borders mark princely states under East India Company or Crown paramountcy; dashed borders mark schematic cores or dated reference footprints. Plain neutral areas mean unresolved coverage, not an absence of rule. Search, region, period and timeline zoom also constrain the map. The 50-year toggle affects only the chronology: the map includes shorter-lived rulers. The vertical dotted line on the timeline marks the map year. Horizontal bars split at the start of Company or Crown paramountcy: dotted outlines mark the subordinate phase.</p>
      <p class="dynasty-map-note">Generalized boundaries change when the source records change. Schematic cores are unfilled outlines. Dated reference footprints locate a state without claiming an annual frontier. Smaller regional and princely territories appear above broader imperial footprints. Overlapping outlines can express layered authority or uncertainty, rather than two exclusive owners. The 1947 frame represents the eve of partition, using the source’s 1946 territory snapshot. They are not annual surveys. Turn off uncertain / reference outlines to show dated source polygons only. These are historical reconstructions, not certified frontiers. Names with hidden geometry remain in the active list. Timeline dates and map coverage differ, and some polygons describe a wider polity rather than a single house. Select an active name or territory to read its chronology below.</p>
    </section>
    <div class="dynasty-chart-meta">
      <p id="dynasty-status" role="status" aria-live="polite">Loading the local chronology…</p>
      <button id="dynasty-reset-zoom" type="button" disabled>Reset zoom</button>
    </div>
    <p class="dynasty-hint">Drag horizontally on the chart to zoom. Hover for dates, click a bar for sources. Wikipedia links are in the table below. Use the selector below on a keyboard or touch screen. “c.” marks approximate dates or plotting anchors.</p>
    <div id="dynasty-detail" class="dynasty-detail" hidden>
      <label for="dynasty-choice">Read about a dynasty<select id="dynasty-choice" disabled></select></label>
      <div aria-live="polite" aria-atomic="true">
        <p class="dynasty-detail-heading"><strong id="dynasty-detail-name"></strong> <span id="dynasty-detail-dates"></span></p>
        <p id="dynasty-detail-area"></p>
        <p id="dynasty-detail-note"></p>
        <p id="dynasty-detail-sources" class="dynasty-source-links"></p>
      </div>
    </div>
    <p id="dynasty-empty" hidden>No entries match. Try a broader search, another period, or Reset all.</p>
    <div class="dynasty-chart-scroll" tabindex="0" role="region" aria-label="Timeline. On narrow screens, scroll horizontally to see the dates and bars.">
      <div id="dynasty-tooltip" class="dynasty-tooltip" role="tooltip" hidden></div>
      <div id="dynasty-chart" role="img" aria-label="Horizontal time bars for selected South Asian dynasties, ordered by start date and coloured by region. A table of the same entries follows the chart."></div>
    </div>
    <details class="dynasty-table-details">
      <summary>Read the timeline as a table · Wikipedia links</summary>
      <div class="dynasty-table-scroll"><table><caption>Entries matching the current search, region and time window. Select a name for sources.</caption><thead><tr><th scope="col">Dynasty / regime / phase</th><th scope="col">Dates</th><th scope="col">Territory / centre</th><th scope="col">Region</th></tr></thead><tbody id="dynasty-table-body"></tbody></table></div>
    </details>
    <noscript><p>This interactive timeline needs JavaScript. The <a href="{{ '/data/south-asian-dynasties/dynasties.json' | relative_url }}">local chronology download</a> includes all entries, dates and sources.</p></noscript>
  </section>
  <section class="dynasty-notes" aria-labelledby="dynasty-scope">
    <h2 id="dynasty-scope">Reading dates and territories</h2>
    <p>The modern borders are a geographic filter, not historical identities or a position on disputed boundaries. A dynasty qualifies if it governed territory within this area, regardless of its origin or whether its empire extended beyond it. Nepal and Bhutan are included. Rule confined to Sri Lanka or Afghanistan is outside the selection. Invasion or raiding alone does not qualify.</p>
    <p>Colours identify principal regions of rule. The chronology is ordered by start date across all regions. Each dynasty appears once, even if it crossed several regions. Bars have equal height and encode time only. Neither their length nor their position measures population, territory, influence, or exclusive sovereignty. Dates may include subordinate, nominal, or claimant rule, as noted for each entry.</p>
    <p>Solid chronology bars show rule before or outside British paramountcy. British paramountcy includes the East India Company as well as Crown administration. Dotted bar outlines mark the period under it. The chronology toggle can hide entries whose every continuous reign is shorter than 50 years. If one reign lasts at least 50 years, all that entry’s reigns remain visible, including short ones separated by gaps. The map always includes short-lived entries.</p>
    <p>This is a non-exhaustive selection, not a complete succession of rulers. Some bars cover a particular phase, and missing bars do not mean an absence of government. Gaps represent excluded or interrupted phases. Ancient dates are often disputed, and century-level dates use rounded anchors. BCE and CE have no year zero. Both views stop in 1947. East India Company territorial rule and the British Raj are included as colonial regimes. Their bars mark administration, rather than a single hereditary house. Annual endpoints include transition years and do not imply control for an entire calendar year.</p>
  </section>
  <footer class="data-sources">
    <p class="eyebrow">Data and sources</p>
    <p>Dates, regional-state identifications and historical context are curated from <a href="https://en.wikipedia.org/">Wikipedia and its contributors</a>, <a href="https://timelinesouthasianhistory.hsites.harvard.edu/chronology">Harvard’s A Timeline of South Asian History</a>, the Metropolitan Museum of Art’s <a href="https://www.metmuseum.org/toah/hd/ssar/hd_ssar.htm">dynastic ruler lists</a> and regional chronologies, and additional references linked in the entry details. The table links each entry to its Wikipedia article, and the downloadable source registry records the articles consulted. Source conventions differ, so entries identify phases and explain important choices. Sources checked 13 November 2026.</p>
    <p><a href="{{ '/data/south-asian-dynasties/dynasties.json' | relative_url }}" download>Download chronology and sources (JSON)</a> · <a href="{{ '/data/south-asian-dynasties/README.md' | relative_url }}">Read the data documentation</a></p>
    <p>Historical map: <a href="https://doi.org/10.1038/s41597-025-04516-9">Cliopatria, Seshat Global History Databank</a> (v0.2.1), adapted under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Local polygons are filtered, clipped and simplified. Basemap and geographic mask: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a> 1:50m v5.1.2, public domain. Its boundary conventions are geographic context, not a position on disputed sovereignty. <a href="{{ '/data/south-asian-dynasties/map.json' | relative_url }}" download>Download map data (JSON)</a> · <a href="{{ '/data/south-asian-dynasties/map-sources.json' | relative_url }}">Map provenance</a>. Regional reference outlines: <a href="https://www.indiastatestory.in/datadownloads">India State Stories</a>, digitized from the Census of India Administrative Atlas, via <a href="https://github.com/ramSeraph/indian_admin_boundaries/releases/tag/historical">ramSeraph / Datameet</a>. Additional extent references from <a href="https://commons.wikimedia.org/">Wikimedia Commons</a>, consulted through Wikipedia: <a href="https://commons.wikimedia.org/wiki/File:Ahom-kingdom-c1826p.png">Chaipau, c.1826</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>), approximately traced and georeferenced, and <a href="https://commons.wikimedia.org/wiki/File:Ahom_kingdom_Map_(till_early_16th_century).jpg">Ananya Taye, early period</a> (CC0), consulted as a schematic reference. The combined derived map data are shared under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</p>
    <p>Inspired by Danilo Di Cuia’s <a href="https://observablehq.com/@tezzutezzu/world-history-timeline">World History Timeline</a>: horizontal time bars, regional colours, and chronological sorting. This page uses its own curated data and implementation. Charts, code, and data are served locally.</p>
  </footer>
</article>
<script src="{{ '/assets/vendor/plotly-basic-3.0.1.min.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/dynasty-map.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/south-asian-dynasties.js' | relative_url }}" data-source="{{ '/data/south-asian-dynasties/dynasties.json' | relative_url }}" data-map-source="{{ '/data/south-asian-dynasties/map.json' | relative_url }}" defer></script>

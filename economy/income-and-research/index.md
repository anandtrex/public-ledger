---
layout: default
listed: true
section: Economy
date: 2026-11-13 11:00:00 +0000
title: GDP per capita and R&D spending
description: Compare nominal GDP per capita with research and development spending as a share of GDP across countries.
permalink: /economy/income-and-research/
---

<article class="analysis-page">
  <header class="analysis-header">
    <p class="eyebrow">Economy · Country comparison</p>
    <h1>Does a richer country invest more in research?</h1>
    <p class="analysis-deck">Compare nominal GDP per person with research and development spending, in current US dollars or as a share of the economy.</p>
  </header>

  <section class="chart-panel" aria-labelledby="chart-heading">
    <div class="chart-controls">
      <div>
        <p class="eyebrow">Explore the data</p>
        <h2 id="chart-heading">Income and research spending</h2>
      </div>
      <label class="year-control" for="spending-measure">R&amp;D measure <select id="spending-measure"><option value="absolute" selected>Absolute spending (US$)</option><option value="share">Share of GDP (%)</option></select></label>
      <label class="year-control" for="chart-trend"><input type="checkbox" id="chart-trend" checked> Show trend (R² ≥ 0.5)</label>
      <label class="year-control" for="chart-year">Year <select id="chart-year" disabled><option>Loading…</option></select></label>
    </div>
    <details class="country-picker">
      <summary>Highlight countries <span id="country-selection-count">0 selected</span></summary>
      <div class="country-picker-controls">
        <label for="country-search">Find a country</label>
        <input id="country-search" type="search" placeholder="Search countries…" autocomplete="off">
        <button id="clear-countries" type="button">Clear selection</button>
      </div>
      <div id="country-options" class="country-options" role="group" aria-label="Countries to outline"></div>
      <p>Selected countries have a dark outline and a horizontal spending guide. Click a circle to toggle its selection. Selections persist across years and depend on available data.</p>
    </details>
    <p id="chart-status" class="chart-status" role="status" aria-live="polite">Loading country data…</p>
    <div class="chart-wrap">
      <div id="chart-tooltip" class="chart-tooltip" role="tooltip" hidden></div>
      <div id="income-rd-chart" class="income-rd-chart" role="img" aria-label="Scatter plot of nominal GDP per capita against the selected R&D spending measure. Each marker is a country or territory for the selected year."></div>
    </div>
    <p class="chart-hint">Select a year above. Hover over a point to see the country and values. Drag to zoom, double-click to reset, or use the chart toolbar to save an image. The horizontal axis uses a logarithmic scale. Axis ranges stay fixed across years, for income and separately for each R&amp;D measure. Circle area is proportional to total nominal GDP in the selected year, using the same size scale across years. A minimum marker size keeps small economies visible.</p>
  </section>

  <section class="analysis-notes" aria-labelledby="reading-chart">
    <div>
      <p class="eyebrow">How to read this</p>
      <h2 id="reading-chart">Two measures, one comparison.</h2>
    </div>
    <div class="analysis-copy">
      <p>Each dot represents a country or territory for a year in which both measures are reported. GDP per capita is GDP divided by population. It describes average economic output per person, not the income received by a typical person or household.</p>
      <p>Nominal GDP per capita is expressed in current US dollars, converted at market exchange rates. It is not adjusted for inflation or differences in the cost of living, so exchange-rate movements can shift a country’s position. The logarithmic horizontal axis gives low and high values room to be compared.</p>
      <p>Larger circles represent larger economies, measured by total nominal GDP. Countries missing total GDP are omitted. Absolute R&amp;D spending is calculated as total nominal GDP multiplied by the R&amp;D percentage divided by 100. It is shown in billions of current US dollars, without inflation adjustment. The optional dotted line is an unweighted ordinary least squares fit of the selected spending measure on log10 GDP per capita for the displayed countries. The legend reports R² for that fit. It describes association and does not establish causation.</p>
      <p>R&amp;D spending includes basic research, applied research, and experimental development, as a share of GDP. Countries with missing data for either measure in the selected year are omitted. Regional and income-group aggregates are excluded.</p>
    </div>
  </section>

  <footer class="data-sources">
    <p><a href="{{ '/economy/research-spending-and-output/' | relative_url }}">Compare research spending with research output →</a></p>
    <p class="eyebrow">Data and sources</p>
    <p>R&amp;D expenditure (% of GDP): <a href="https://ourworldindata.org/grapher/research-spending-gdp">Our World in Data</a>, sourced from UNESCO UIS via the World Bank. GDP per capita (current US$): <a href="https://data.worldbank.org/indicator/NY.GDP.PCAP.CD">World Bank World Development Indicators</a>. Total nominal GDP: <a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD">World Bank NY.GDP.MKTP.CD</a>. A local snapshot of these datasets is served with this site.</p>
    <p class="source-note">The current OWID GDP-per-capita series uses constant international dollars or constant US dollars. The World Bank current-US-dollar indicator is used here to preserve the requested nominal comparison.</p>
  </footer>
</article>

<script src="{{ '/assets/vendor/plotly-basic-3.0.1.min.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/income-rd-scatter.js' | relative_url }}?v={{ site.time | date: '%s' }}" data-data-root="{{ '/data/income-and-research' | relative_url }}" defer onerror="document.getElementById('chart-status').textContent = 'Chart code failed to load. Check the script path in the browser network panel.'"></script>

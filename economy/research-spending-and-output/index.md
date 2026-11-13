---
layout: default
listed: true
section: Economy
date: 2026-11-13 12:00:00 +0000
title: Research spending and research output
description: Compare national R&D expenditure with research publication counts and citation impact by field.
permalink: /economy/research-spending-and-output/
---

<article class="analysis-page">
  <header class="analysis-header">
    <p class="eyebrow">Economy · Research investment</p>
    <h1>Research spending and research output.</h1>
    <p class="analysis-deck">Compare national R&amp;D investment with publication volume and citation impact in a selected research discipline.</p>
  </header>
  <section class="chart-panel" aria-labelledby="output-heading">
    <div class="chart-controls">
      <h2 id="output-heading">Investment and scholarly influence</h2>
      <label class="year-control" for="output-spending">Spending <select id="output-spending" disabled><option value="absolute">Absolute (current US$)</option><option value="share">Share of GDP (%)</option></select></label>
      <label class="year-control" for="output-metric">Output <select id="output-metric" disabled><option value="top10">Top-10%-cited count</option><option value="top10share">Top-10%-cited share</option><option value="publications">Publication count</option><option value="impact">Normalized citation impact</option></select></label>
      <label class="year-control" for="output-field">Field <select id="output-field" disabled></select></label>
      <label class="year-control" for="output-year">Year <select id="output-year" disabled></select></label>
      <label class="year-control" for="output-trend"><input type="checkbox" id="output-trend" disabled> Show trend line</label>
    </div>
    <p id="output-status" class="chart-status" role="status" aria-live="polite">Loading local research-output data…</p>
    <div class="chart-wrap">
      <div id="output-tooltip" class="chart-tooltip" role="tooltip" hidden></div>
      <div id="output-chart" class="income-rd-chart" role="img" aria-label="Scatter plot of national research spending and research output in the selected field"></div>
    </div>
    <p class="chart-hint">Hover for country details. Circle area represents total nominal GDP, with a minimum visible size. Scales stay fixed across years for the selected field and measures. Absolute spending and publication counts use logarithmic axes; percentages and normalized impact use linear axes. Drag to zoom or use the toolbar to export.</p>
  </section>
  <section class="output-spending-table" aria-labelledby="output-table-title">
    <h2 id="output-table-title">Research output per US$1 billion spent</h2>
    <p>All four metrics are shown for the selected year and research field, regardless of the chart’s output selector. Each column divides the reported metric by national R&amp;D spending in billions of current US dollars. The share and citation-impact columns therefore express percentage points and index points per US$1 billion, respectively.</p>
    <div class="output-table-wrap">
      <table>
        <caption id="output-table-caption">Loading local data…</caption>
        <thead><tr><th scope="col" aria-sort="none"><button type="button" data-output-sort="country">Country<span class="sort-indicator" aria-hidden="true"> ↕</span></button></th><th scope="col" aria-sort="none"><button type="button" data-output-sort="top10">Top-cited count / $1bn<span class="sort-indicator" aria-hidden="true"> ↕</span></button></th><th scope="col" aria-sort="none"><button type="button" data-output-sort="publications">Publication count / $1bn<span class="sort-indicator" aria-hidden="true"> ↕</span></button></th><th scope="col" aria-sort="none"><button type="button" data-output-sort="top10share">Top-cited share (pp) / $1bn<span class="sort-indicator" aria-hidden="true"> ↕</span></button></th><th scope="col" aria-sort="none"><button type="button" data-output-sort="impact">Citation impact (points) / $1bn<span class="sort-indicator" aria-hidden="true"> ↕</span></button></th></tr></thead>
        <tbody id="output-spending-table-body"></tbody>
      </table>
    </div>
    <p class="chart-hint">Only economies in the matched local snapshot are covered. Missing field-level metrics are shown as unavailable. Publication counts are fractional. This compares output in one field with spending across all research fields in the same year; it is not an estimate of the efficiency or causal return of that spending.</p>
  </section>
  <section class="analysis-notes">
    <div><p class="eyebrow">Read with context</p><h2>Investment and influence.</h2></div>
    <div class="analysis-copy">
      <p>Spending covers the whole national R&amp;D system. Output covers only the selected research field. These comparisons describe associations across countries, not the return on spending in that discipline. The default is engineering, top-10%-cited publications, and 2020.</p>
      <p>Publication counts and top-cited counts use fractional counting to share credit between countries. Top-cited share is the percentage of a country's publications in the selected field among the world's 10% most cited. Normalized citation impact is expressed as a percentage of expected impact: 100 is the reference level. Citation measures reflect scholarly attention and do not capture every form of research value.</p>
      <p>Absolute spending is derived as nominal GDP × R&amp;D share ÷ 100. Both spending and publication year are matched exactly. Research can take years to produce publications, and citations accumulate afterward, so this same-year comparison should not be interpreted as research efficiency. Recent citation cohorts need particular care.</p>
      <p>The dotted trend is an unweighted ordinary least squares fit in the displayed coordinates, using logarithms where the axes are logarithmic. The checkbox defaults to showing the line when R² is above 0.5 and controls whether it appears. The legend reports R² in those fitted coordinates, rather than the original units when a logarithm is used. Only countries with both spending and the selected output measure are included. Zero values cannot appear on logarithmic axes. Coverage varies by field and year.</p>
    </div>
  </section>
  <footer class="data-sources">
    <p class="eyebrow">Sources</p>
    <p>Research output: <a href="https://www.oecd.org/en/data/datasets/science-and-bibliometric-indicators.html">OECD Bibliometric Indicators</a>, based on Scopus data, from the <a href="https://data-explorer.oecd.org/vis?df[ag]=OECD.STI.STP&amp;df[ds]=dsDisseminateFinalDMZ&amp;df[id]=DSD_BIBLIO@DF_BIBLIO">indicators by field dataset</a>. R&amp;D share: <a href="https://ourworldindata.org/grapher/research-spending-gdp">Our World in Data, UNESCO UIS via World Bank</a>. Total GDP: <a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD">World Bank</a>. All files and Plotly are served locally. Snapshot downloaded 13 November 2026.</p>
    <p><a href="{{ '/economy/income-and-research/' | relative_url }}">Explore the income and R&amp;D chart →</a></p>
  </footer>
</article>
<script src="{{ '/assets/vendor/plotly-basic-3.0.1.min.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/research-output.js' | relative_url }}" data-source="{{ '/data/research-output/output.json' | relative_url }}" defer></script>

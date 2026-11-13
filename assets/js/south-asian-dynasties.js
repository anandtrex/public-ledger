/* Public Ledger: local, editorial chronology. No provider requests at runtime. */
(function (root) {
  'use strict';
  const colors = ['#397a80', '#a06443', '#687747', '#8a6492', '#b48632', '#527493', '#a14f65', '#63706b'];
  const fullRange = [-412, 1947];
  const eras = { all: fullRange, ancient: [-412, 600], medieval: [600, 1500], earlymodern: [1500, 1947] };
  // Historical 1 BCE (-1) and 1 CE (1) are adjacent. Zero is not a historical year.
  const coordinate = year => year < 0 ? year + 1 : year;
  const yearLabel = year => `${Math.abs(year)} ${year < 0 ? 'BCE' : 'CE'}`;
  const periodLabel = d => (d.approximate ? 'c. ' : '') + d.periods.map(p => `${yearLabel(p.start)}–${yearLabel(p.end)}`).join(' / ');
  const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  function filterRows(rows, region, query, range, includeShort = true) {
    const q = normalize(query);
    return rows.filter(d => (includeShort || d.longest_reign >= 50) && (!region || d.region === region) &&
      normalize(`${d.name} ${d.area} ${d.region} ${(d.aliases || []).join(' ')}`).includes(q) &&
      d.periods.some(p => coordinate(p.end) >= range[0] && coordinate(p.start) <= range[1]));
  }
  function sortRows(rows, sort, regions) {
    return [...rows].sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : 0) || a.periods[0].start - b.periods[0].start || a.name.localeCompare(b.name));
  }
  function ticks(range) {
    const span = range[1] - range[0];
    const step = span > 1400 ? 250 : span > 700 ? 100 : span > 300 ? 50 : span > 100 ? 25 : span > 40 ? 10 : 5;
    const values = [], labels = [];
    for (let year = Math.ceil((range[0] - 1) / step) * step; year <= range[1]; year += step) {
      const historical = year === 0 ? 1 : year;
      values.push(coordinate(historical)); labels.push(yearLabel(historical));
    }
    return { values, labels };
  }
  function splitPeriod(d, period) {
    const sub = d.british_paramountcy;
    if (!sub || period.end <= sub.start || period.start >= sub.end) return [{ ...period, british: false }];
    const result = [];
    if (period.start < sub.start) result.push({ start: period.start, end: sub.start, british: false });
    result.push({ start: Math.max(period.start, sub.start), end: Math.min(period.end, sub.end), british: true });
    if (period.end > sub.end) result.push({ start: sub.end, end: period.end, british: false });
    return result.filter(p => p.end > p.start);
  }
  const api = { coordinate, yearLabel, periodLabel, filterRows, sortRows, ticks, splitPeriod };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  const script = document.currentScript;
  const page = document.getElementById('dynasty-explorer');
  if (!page) return;
  const el = id => document.getElementById(id);
  const chart = el('dynasty-chart'), tooltip = el('dynasty-tooltip');
  let data, visible = [], selected = null, range = [...fullRange], hoverEvent, generation = 0;
  let plotting = Promise.resolve();
  let mapController = null, mapYear = -413, dominionOutlines = [];
  const yearGuide = () => [...dominionOutlines, { type: 'line', xref: 'x', yref: 'paper', x0: coordinate(mapYear), x1: coordinate(mapYear), y0: 0, y1: 1, line: { color: '#172321', width: 1.5, dash: 'dot' } }];
  function hideTooltip() { tooltip.hidden = true; }
  function moveTooltip(event) {
    if (tooltip.hidden || !event) return;
    const box = chart.parentElement.getBoundingClientRect();
    const w = tooltip.offsetWidth, h = tooltip.offsetHeight;
    const x = event.clientX - box.left + chart.parentElement.scrollLeft;
    const y = event.clientY - box.top;
    tooltip.style.left = `${Math.max(8, Math.min(x + 14, box.width - w - 8 + chart.parentElement.scrollLeft))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(y + 14, box.height - h - 8))}px`;
  }
  function describe(d, revealOnMap = false) {
    selected = d.id;
    if (mapController) mapController.select(d.id, revealOnMap);
    el('dynasty-choice').value = d.id;
    el('dynasty-detail-name').textContent = d.name;
    el('dynasty-detail-dates').textContent = periodLabel(d);
    el('dynasty-detail-area').textContent = `${d.region} · ${d.area}`;
    el('dynasty-detail-note').textContent = d.note || 'The bar follows the dated phase in the linked chronology. Territorial boundaries changed during this period.';
    const links = el('dynasty-detail-sources');
    links.replaceChildren();
    d.sources.forEach((key, i) => {
      if (i) links.append(document.createTextNode(' · '));
      const a = document.createElement('a');
      a.href = data.sources[key].url; a.textContent = data.sources[key].title; links.append(a);
    });
    if (chart.data) {
      const widths = chart.data.map(t => t.customdata.map((id, i) => t.meta.british[i] ? 0 : id === selected ? 2.5 : .5));
      root.Plotly.restyle(chart, { 'marker.line.width': widths });
    }
  }
  function tableRows() {
    const body = el('dynasty-table-body'); body.replaceChildren();
    visible.forEach(d => {
      const row = document.createElement('tr'), name = document.createElement('th');
      name.scope = 'row';
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Details';
      if (d.wikipedia) { const link = document.createElement('a'); link.href = d.wikipedia; link.textContent = d.name; link.className = 'dynasty-wikipedia'; name.append(link, document.createTextNode(' ')); } else { name.append(document.createTextNode(d.name + ' ')); }
      button.addEventListener('click', () => { describe(d, true); el('dynasty-detail').scrollIntoView({ block: 'nearest' }); el('dynasty-choice').focus({ preventScroll: true }); });
      name.append(button); row.append(name);
      [periodLabel(d), d.area, d.region].forEach(text => { const td = document.createElement('td'); td.textContent = text; row.append(td); });
      body.append(row);
    });
  }
  function render(resetRange = false) {
    hideTooltip();
    if (resetRange) range = [...eras[el('dynasty-era').value]];
    visible = sortRows(filterRows(data.dynasties, el('dynasty-region').value, el('dynasty-search').value, range, el('dynasty-short').checked), el('dynasty-sort').value, data.regions);
    if (mapController) mapController.filter(filterRows(data.dynasties, el('dynasty-region').value, el('dynasty-search').value, range).map(d => d.id), range);
    const version = ++generation;
    el('dynasty-status').textContent = `${visible.length} of ${data.dynasties.length} entries · ${yearLabel(range[0] <= 0 ? Math.round(range[0]) - 1 : Math.round(range[0]))} to ${yearLabel(Math.round(range[1]))}`;
    const choice = el('dynasty-choice'); choice.replaceChildren();
    visible.forEach(d => { const option = document.createElement('option'); option.value = d.id; option.textContent = `${d.name} (${periodLabel(d)})`; choice.append(option); });
    choice.disabled = !visible.length;
    el('dynasty-detail').hidden = !visible.length;
    el('dynasty-empty').hidden = !!visible.length;
    chart.hidden = !visible.length;
    tableRows();
    if (!visible.length) return;
    const rows = visible.map((d, y) => ({ d, y }));
    const position = rows.length;
    dominionOutlines = [];
    const traces = data.regions.map((region, i) => {
      const points = rows.filter(row => row.d.region === region).flatMap(row => row.d.periods.flatMap(p => splitPeriod(row.d, p).map(segment => ({ ...row, p: segment }))));
      points.filter(r => r.p.british).forEach(r => dominionOutlines.push({ type: 'rect', xref: 'x', yref: 'y', x0: coordinate(r.p.start), x1: coordinate(r.p.end), y0: r.y - .31, y1: r.y + .31, line: { color: '#172321', width: 1.5, dash: 'dot' }, fillcolor: 'rgba(0,0,0,0)', layer: 'above' }));
      return { type: 'bar', orientation: 'h', name: region,
        x: points.map(r => coordinate(r.p.end) - coordinate(r.p.start)),
        base: points.map(r => coordinate(r.p.start)), y: points.map(r => r.y),
        customdata: points.map(r => r.d.id), meta: { british: points.map(r => r.p.british), phaseTexts: points.map(r => `${yearLabel(r.p.start)}–${yearLabel(r.p.end)} · ${r.p.british ? 'Under British paramountcy (Company / Crown)' : 'Before / outside British paramountcy'}`) }, width: .62, hoverinfo: 'none',
        marker: { color: colors[i], line: { color: '#172321', width: points.map(r => r.p.british ? 0 : r.d.id === selected ? 2.5 : .5) } }
      };
    }).filter(t => t.x.length);
    const tick = ticks(range);
    const annotations = [];
    const layout = { height: Math.max(350, position * 28 + 100), margin: { l: 228, r: 22, t: 48, b: 48 },
      paper_bgcolor: '#fffefa', plot_bgcolor: '#fffefa', font: { family: 'Arial, sans-serif', color: '#172321', size: 12 },
      shapes: yearGuide(), showlegend: false, barmode: 'overlay', bargap: .2, dragmode: 'zoom', hovermode: 'closest',
      xaxis: { range, tickmode: 'array', tickvals: tick.values, ticktext: tick.labels, side: 'top', fixedrange: false,
        showgrid: true, gridcolor: '#e6e5dd', zeroline: false, showline: true, linecolor: '#b9beb4', mirror: 'ticks', automargin: true },
      yaxis: { range: [position - .25, -1], tickmode: 'array', tickvals: rows.map(r => r.y),
        ticktext: rows.map(r => `${r.d.approximate ? 'c. ' : ''}${r.d.name}`), fixedrange: true,
        showgrid: false, zeroline: false, automargin: true }, annotations,
    };
    plotting = plotting.then(async () => {
      if (version !== generation) return;
      await root.Plotly.react(chart, traces, layout, { responsive: true, displaylogo: false, scrollZoom: false,
        modeBarButtonsToRemove: ['select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
        toImageButtonOptions: { format: 'png', filename: 'south-asian-dynasties', scale: 2 } });
      if (version !== generation) return;
      if (!chart._dynastyBound) {
        chart._dynastyBound = true;
        chart.on('plotly_hover', event => {
          const d = data.dynasties.find(d => d.id === event.points[0].customdata);
          if (!d) return;
          tooltip.replaceChildren();
          const strong = document.createElement('strong'); strong.textContent = d.name;
          const point = event.points[0];
          const phase = point.data && point.data.meta ? point.data.meta.phaseTexts[point.pointNumber ?? point.pointIndex ?? 0] : '';
          tooltip.append(strong, document.createTextNode(`${phase || periodLabel(d)} · ${d.area}`));
          tooltip.hidden = false; moveTooltip(hoverEvent || event.event);
        });
        chart.on('plotly_unhover', hideTooltip);
        chart.on('plotly_click', event => {
          const d = data.dynasties.find(d => d.id === event.points[0].customdata); if (d) describe(d, true);
        });
        chart.on('plotly_relayout', event => {
          if (event['xaxis.range[0]'] !== undefined && event['xaxis.range[1]'] !== undefined) {
            range = [event['xaxis.range[0]'], event['xaxis.range[1]']]; render();
          }
        });
        chart.on('plotly_doubleclick', () => { render(true); return false; });
      }
      describe(visible.find(d => d.id === selected) || visible.find(d => d.id === 'maurya') || visible[0]);
    }).catch(error => { el('dynasty-status').textContent = 'The chart could not render. The accessible table and data download remain available.'; console.error(error); });
  }
  chart.addEventListener('pointermove', event => { hoverEvent = event; moveTooltip(event); });
  chart.addEventListener('pointerleave', hideTooltip);
  chart.parentElement.addEventListener('scroll', hideTooltip);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTooltip(); });
  async function init() {
    try {
      const response = await fetch(script.dataset.source);
      if (!response.ok) throw new Error(`Data HTTP ${response.status}`);
      data = await response.json();
      fullRange[0] = Math.min(...data.dynasties.flatMap(d => d.periods.map(p => coordinate(p.start))));
      eras.ancient[0] = fullRange[0];
      mapYear = fullRange[0] <= 0 ? fullRange[0] - 1 : fullRange[0];
      if (!root.Plotly) throw new Error('Local plotting library unavailable');
      data.regions.forEach(region => { const option = document.createElement('option'); option.value = region; option.textContent = region; el('dynasty-region').append(option); });
      page.querySelectorAll('input, select, button').forEach(control => { control.disabled = false; });
      ['dynasty-region', 'dynasty-sort', 'dynasty-short'].forEach(id => el(id).addEventListener('change', () => render()));
      el('dynasty-era').addEventListener('change', () => render(true));
      el('dynasty-search').addEventListener('input', () => render());
      el('dynasty-choice').addEventListener('change', () => describe(data.dynasties.find(d => d.id === el('dynasty-choice').value), true));
      el('dynasty-reset').addEventListener('click', () => { el('dynasty-era').value = 'all'; el('dynasty-region').value = ''; el('dynasty-search').value = ''; el('dynasty-sort').value = 'time'; el('dynasty-short').checked = true; render(true); });
      el('dynasty-reset-zoom').addEventListener('click', () => render(true));
      render(true);
      if (root.PublicLedgerDynastyMap && script.dataset.mapSource) {
        root.PublicLedgerDynastyMap.create({ data, source: script.dataset.mapSource,
          onSelect: id => {
            selected = id;
            if (!visible.some(d => d.id === id)) { el('dynasty-short').checked = true; render(); }
            describe(data.dynasties.find(d => d.id === id));
          },
          onYear: year => {
            mapYear = year;
            if (chart.data) root.Plotly.relayout(chart, { shapes: yearGuide() });
          },
        }).then(controller => {
          mapController = controller;
          mapController.filter(filterRows(data.dynasties, el('dynasty-region').value, el('dynasty-search').value, range).map(d => d.id), range);
          if (selected) mapController.select(selected);
        }).catch(error => {
          el('dynasty-map-status').textContent = 'Map data could not load. The timeline remains available.';
          console.error(error);
        });
      }
    } catch (error) {
      el('dynasty-status').textContent = 'Timeline unavailable. Please use the local JSON download below and try reloading.';
      console.error(error);
    }
  }
  init();
})(typeof window !== 'undefined' ? window : globalThis);

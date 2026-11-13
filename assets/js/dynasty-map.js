/* Historical polygons are local Cliopatria extracts, not live map tiles. */
(function (root) {
  'use strict';
  const colors = ['#397a80', '#a06443', '#687747', '#8a6492', '#b48632', '#527493', '#a14f65', '#63706b'];
  const fills = ['#91b4b8', '#c7a58f', '#acb58e', '#b9a2c2', '#d4bc80', '#9faec5', '#c993a3', '#b6bdb8'];
  const coordinate = year => year < 0 ? year + 1 : year;
  const historical = value => value <= 0 ? value - 1 : value;
  const label = year => `${Math.abs(year)} ${year < 0 ? 'BCE' : 'CE'}`;
  const activeAt = (d, year) => d.periods.some(p => year >= p.start && year <= p.end);
  function atYear(map, dynasties, ids, year, includeUncertain = true) {
    const active = dynasties.filter(d => ids.has(d.id) && activeAt(d, year));
    
    // The final frame represents the eve of partition, using the source's 1946 polygons.
    const boundaryYear = year === 1947 ? 1946 : year;
    const chosen = new Map();
    for (const d of active) {
      const records = map.territories.filter(t => t.dynastyIds.includes(d.id));
      const available = records.filter(t => boundaryYear >= t.start && boundaryYear <= t.end && (includeUncertain || t.kind === 'generalized' || (t.source === 'india-1941' && t.referenceYear === boundaryYear)));
      const references = available.filter(t => t.kind === 'reference');
      const generalized = available.filter(t => !t.kind || t.kind === 'generalized');
      const cores = available.filter(t => t.kind === 'core');
      const imageReferences = references.filter(t => t.source === 'commons-ahom');
      let picked = imageReferences.length ? imageReferences : year >= 1800 && references.length ? references : generalized.length ? generalized : cores.length ? cores : references;
      if (includeUncertain && !picked.length && records.length) {
        const nearest = [...records].sort((a, b) => Math.min(Math.abs(boundaryYear - a.start), Math.abs(boundaryYear - a.end)) - Math.min(Math.abs(boundaryYear - b.start), Math.abs(boundaryYear - b.end)))[0];
        picked = [{ ...nearest, kind: 'reference', referenceYear: boundaryYear < nearest.start ? nearest.start : nearest.end,
          note: 'Nearest available source outline used only as an approximate locator outside its dated interval.' }];
      }
      for (const t of picked) {
        const key = `${t.id}-${t.kind || 'generalized'}`;
        if (!chosen.has(key)) chosen.set(key, { ...t, dynastyIds: [] });
        chosen.get(key).dynastyIds.push(d.id);
      }
    }
    const territories = [...chosen.values()];
    const mapped = new Set(territories.flatMap(t => t.dynastyIds));
    return { active, territories, mapped };
  }
  function paths(geometry) {
    const x = [], y = [];
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    polygons.forEach(polygon => polygon.forEach(ring => {
      ring.forEach(p => { x.push(p[0]); y.push(p[1]); }); x.push(null); y.push(null);
    }));
    return { x, y };
  }
  const princelyAt = (d, year) => !!d.british_paramountcy && year >= d.british_paramountcy.start && year <= d.british_paramountcy.end;
  const api = { coordinate, historical, label, activeAt, atYear, paths, princelyAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  root.PublicLedgerDynastyMap = { async create({ data, source, onSelect, onYear }) {
    const el = id => document.getElementById(id);
    const chart = el('dynasty-map'), tooltip = el('dynasty-map-tooltip');
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Map data HTTP ${response.status}`);
    const map = await response.json();
    const earliestYear = Math.min(...data.dynasties.flatMap(d => d.periods.map(p => p.start)));
    const minimumCoordinate = coordinate(earliestYear);
    let year = earliestYear, selected = null, ids = new Set(data.dynasties.map(d => d.id));
    let limits = [minimumCoordinate, 1947], playing = false, timer = null, generation = 0, pointer;
    let plotting = Promise.resolve();
    const byId = new Map(data.dynasties.map(d => [d.id, d]));
    const pointMeta = point => point.data && point.data.meta;
    const buttons = ['dynasty-map-play', 'dynasty-map-back', 'dynasty-map-next', 'dynasty-map-year', 'dynasty-map-slider', 'dynasty-map-step', 'dynasty-map-names', 'dynasty-map-uncertain'];
    buttons.forEach(id => { el(id).disabled = false; });
    const areaPath = (geometry, extra) => ({ type: 'scatter', mode: 'lines', ...paths(geometry),
      fill: 'toself', hoverinfo: 'skip', showlegend: false, line: { width: .6, color: '#c6c8bf' }, ...extra });
    const background = map.background.map(f => areaPath(f.geometry, { fillcolor: '#eeeee6' }));
    const scope = { type: 'scatter', mode: 'lines', ...paths(map.scope), hoverinfo: 'skip', showlegend: false,
      line: { color: '#858e86', width: .7 } };
    function hideTooltip() { tooltip.hidden = true; }
    function positionTooltip(event) {
      if (tooltip.hidden || !event) return;
      const rect = chart.parentElement.getBoundingClientRect();
      tooltip.style.left = `${Math.max(8, Math.min(event.clientX - rect.left + 12, rect.width - tooltip.offsetWidth - 8))}px`;
      tooltip.style.top = `${Math.max(8, Math.min(event.clientY - rect.top + 12, rect.height - tooltip.offsetHeight - 8))}px`;
    }
    function pause() {
      playing = false; if (timer !== null) root.clearTimeout(timer); timer = null;
      el('dynasty-map-play').textContent = 'Play'; el('dynasty-map-play').setAttribute('aria-pressed', 'false');
      el('dynasty-map-status').setAttribute('aria-live', 'polite');
    }
    function renderList(state) {
      const list = el('dynasty-map-active'); list.replaceChildren();
      state.active.forEach(d => {
        const item = document.createElement('li'), button = document.createElement('button');
        button.type = 'button'; button.textContent = d.name;
        button.setAttribute('aria-pressed', String(selected === d.id));
        button.style.setProperty('--dynasty-colour', colors[data.regions.indexOf(d.region)]);
        const note = document.createElement('span');
        const territory = state.territories.find(t => t.dynastyIds.includes(d.id));
        const coverage = !territory ? (el('dynasty-map-uncertain').checked ? 'No boundary coverage' : 'No dated source polygon; uncertain outline hidden') : territory.kind === 'core' ? 'Schematic core area, not a frontier' : territory.kind === 'reference' ? `Approximate reference footprint (${label(territory.referenceYear)})` : 'Generalized source territory';
        note.textContent = (princelyAt(d, year) ? `Princely state under ${year < 1858 ? 'East India Company' : 'British Crown'} paramountcy · ` : '') + coverage;
        button.addEventListener('click', () => { pause(); selected = d.id; onSelect(d.id); render(); });
        item.append(button, note); list.append(item);
      });
      if (!state.active.length) { const item = document.createElement('li'); item.textContent = 'No entries from this selection are active in this year.'; list.append(item); }
      el('dynasty-map-status').textContent = `${state.active.length} active entries · ${state.mapped.size} with territory or locator outlines · ${state.active.length - state.mapped.size} without a visible outline${el('dynasty-map-uncertain').checked ? '' : ' · sourced boundaries only'}`;
    }
    function render() {
      const version = ++generation;
      const state = atYear(map, data.dynasties, ids, year, el('dynasty-map-uncertain').checked);
      hideTooltip();
      el('dynasty-map-slider').value = coordinate(year);
      el('dynasty-map-slider').setAttribute('aria-valuetext', label(year));
      el('dynasty-map-year').value = year;
      el('dynasty-map-date').textContent = label(year);
      el('dynasty-map-back').disabled = coordinate(year) <= limits[0];
      el('dynasty-map-next').disabled = coordinate(year) >= limits[1];
      renderList(state);
      const filled = [...state.territories].sort((a, b) => b.labelArea - a.labelArea).map(t => {
        const dynastyIds = t.dynastyIds.filter(id => state.active.some(d => d.id === id));
        const d = byId.get(dynastyIds[0]);
        const color = colors[data.regions.indexOf(d.region)];
        const princely = dynastyIds.some(id => princelyAt(byId.get(id), year));
        const uncertain = t.kind === 'core' || t.kind === 'reference';
        return areaPath(t.geometry, { fill: t.kind === 'core' ? 'none' : 'toself', fillcolor: fills[data.regions.indexOf(d.region)], opacity: 1, hoverinfo: 'none', hoveron: 'fills',
          line: { color: dynastyIds.includes(selected) || princely || uncertain ? '#172321' : '#fffefa', width: dynastyIds.includes(selected) ? 2.5 : princely ? 1.6 : 1, dash: princely ? 'dot' : uncertain ? 'dash' : 'solid' },
          meta: { ids: dynastyIds, name: t.name, start: t.start, end: t.end, note: t.note || 'Generalized boundary', kind: t.kind, referenceYear: t.referenceYear, princely: dynastyIds.some(id => princelyAt(byId.get(id), year)) } });
      });
      const labels = el('dynasty-map-names').checked ? state.territories.filter(t => t.labelArea >= .7).map(t => {
        const dynastyIds = t.dynastyIds.filter(id => state.active.some(d => d.id === id));
        const text = dynastyIds.map(id => byId.get(id).name.split(' · ')[0]).join(' / ');
        return { type: 'scatter', mode: 'text', x: [t.label[0]], y: [t.label[1]], text: [text],
          textfont: { family: 'Arial, sans-serif', size: 10, color: '#172321' }, hoverinfo: 'none', showlegend: false,
          meta: { ids: dynastyIds, name: t.name, start: t.start, end: t.end, note: t.note || 'Generalized boundary', kind: t.kind, referenceYear: t.referenceYear, princely: dynastyIds.some(id => princelyAt(byId.get(id), year)) } };
      }) : [];
      const unknown = areaPath(map.scope, { fillcolor: '#efeee7' });
      const traces = [...background, unknown, ...filled, scope, ...labels];
      const layout = { height: 450, margin: { l: 5, r: 5, t: 5, b: 5 }, paper_bgcolor: '#f7f8f4', plot_bgcolor: '#e6eff0',
        showlegend: false, hovermode: 'closest', dragmode: false,
        xaxis: { range: [map.bounds[0], map.bounds[2]], visible: false, fixedrange: true, constrain: 'domain' },
        yaxis: { range: [map.bounds[1], map.bounds[3]], visible: false, fixedrange: true, scaleanchor: 'x', scaleratio: 1.08, constrain: 'domain' } };
      plotting = plotting.then(async () => {
        if (version !== generation) return;
        await root.Plotly.react(chart, traces, layout, { responsive: true, displayModeBar: false, displaylogo: false });
        if (version !== generation) return;
        if (!chart._dynastyMapBound) {
          chart._dynastyMapBound = true;
          chart.on('plotly_click', event => {
            const meta = pointMeta(event.points[0]); if (!meta || !meta.ids.length) return;
            pause(); selected = meta.ids.includes(selected) ? selected : meta.ids[0]; onSelect(selected); render();
          });
          chart.on('plotly_hover', event => {
            const meta = pointMeta(event.points[0]); if (!meta) return;
            tooltip.replaceChildren(); const title = document.createElement('strong');
            title.textContent = meta.ids.map(id => byId.get(id).name).join(' / ');
            tooltip.append(title, document.createTextNode(`${meta.name} · ${meta.princely ? 'Princely state under British paramountcy. ' : ''}${meta.note}${meta.referenceYear ? ' Reference: ' + label(meta.referenceYear) + '.' : ' Source interval: ' + label(meta.start) + '–' + label(meta.end) + '.'}`));
            tooltip.hidden = false; positionTooltip(pointer || event.event);
          });
          chart.on('plotly_unhover', hideTooltip);
        }
      }).catch(error => {
        pause(); buttons.forEach(id => { el(id).disabled = true; });
        el('dynasty-map-status').textContent = 'Map rendering failed. The timeline and data downloads remain available.'; console.error(error);
      });
      onYear(year);
      return plotting;
    }
    function setYear(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return plotting;
      const next = numeric === 0 ? 1 : Math.round(numeric);
      year = historical(Math.max(limits[0], Math.min(coordinate(next), limits[1])));
      return render();
    }
    function step(direction) {
      const amount = Number(el('dynasty-map-step').value) || 10;
      return setYear(historical(coordinate(year) + direction * amount));
    }
    async function tick() {
      if (!playing) return;
      if (coordinate(year) >= limits[1]) { pause(); return; }
      await step(1);
      if (playing) timer = root.setTimeout(tick, 650);
    }
    el('dynasty-map-play').addEventListener('click', () => {
      if (playing) { pause(); return; }
      if (coordinate(year) >= limits[1]) setYear(historical(limits[0]));
      playing = true; el('dynasty-map-play').textContent = 'Pause';
      el('dynasty-map-play').setAttribute('aria-pressed', 'true'); el('dynasty-map-status').setAttribute('aria-live', 'off');
      timer = root.setTimeout(tick, 650);
    });
    el('dynasty-map-back').addEventListener('click', () => { pause(); step(-1); });
    el('dynasty-map-next').addEventListener('click', () => { pause(); step(1); });
    el('dynasty-map-slider').addEventListener('input', () => { pause(); setYear(historical(Number(el('dynasty-map-slider').value))); });
    el('dynasty-map-year').addEventListener('change', () => { pause(); setYear(el('dynasty-map-year').value); });
    el('dynasty-map-names').addEventListener('change', render);
    el('dynasty-map-uncertain').addEventListener('change', () => { pause(); render(); });
    chart.addEventListener('pointermove', event => { pointer = event; positionTooltip(event); });
    chart.addEventListener('pointerleave', hideTooltip);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTooltip(); });
    await render();
    return {
      filter(nextIds, range) {
        pause(); ids = new Set(nextIds);
        limits = [Math.max(minimumCoordinate, Math.min(1947, Math.ceil(range[0]))), Math.max(minimumCoordinate, Math.min(1947, Math.floor(range[1])))];
        if (limits[0] > limits[1]) limits[1] = limits[0];
        el('dynasty-map-slider').min = limits[0]; el('dynasty-map-slider').max = limits[1];
        el('dynasty-map-year').min = historical(limits[0]); el('dynasty-map-year').max = historical(limits[1]);
        return setYear(year);
      },
      select(id, jump = false) {
        selected = id;
        if (jump && (!activeAt(byId.get(id), year) || !atYear(map, data.dynasties, ids, year, el('dynasty-map-uncertain').checked).mapped.has(id))) {
          pause(); const d = byId.get(id);
          const candidates = map.territories.filter(t => t.dynastyIds.includes(id)).flatMap(t => d.periods.map(p => [
            Math.max(coordinate(p.start), coordinate(t.start), limits[0]), Math.min(coordinate(p.end), coordinate(t.end), limits[1])])).filter(p => p[0] <= p[1]);
          const period = candidates[0] || [Math.max(coordinate(d.periods[0].start), limits[0]), Math.min(coordinate(d.periods[0].end), limits[1])];
          return setYear(historical(Math.round((period[0] + period[1]) / 2)));
        }
        return render();
      },
      pause,
    };
  } };
})(typeof window !== 'undefined' ? window : globalThis);

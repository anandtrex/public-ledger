/* Data and controller checks. This does not substitute for browser visual QA. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'assets/js/south-asian-dynasties.js'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/south-asian-dynasties/dynasties.json')));
const phaseCount = data.dynasties.reduce((sum, d) => sum + d.periods.reduce((n, p) => n + require('../assets/js/south-asian-dynasties.js').splitPeriod(d, p).length, 0), 0);
assert(data.dynasties.every(d => d.periods.every(p => p.end <= 1947)));
assert(data.dynasties.some(d => d.id === 'british-raj' && d.periods[0].end === 1947));
const helpers = require('../assets/js/south-asian-dynasties.js');
assert.equal(helpers.coordinate(1) - helpers.coordinate(-1), 1);
assert.equal(helpers.yearLabel(-1), '1 BCE');
assert(helpers.periodLabel(data.dynasties.find(d => d.id === 'mughal')).includes('1540 CE / 1555 CE'));
assert.equal(helpers.filterRows(data.dynasties, '', '  CHOLA ', [-399, 1947])[0].id, 'chola');
assert(helpers.filterRows(data.dynasties, '', 'Bengal', [-399, 1947]).every(d => /Bengal/i.test(`${d.name} ${d.area} ${d.region}`)));
assert.equal(helpers.filterRows(data.dynasties, '', 'mughal', [1541, 1554]).length, 0);
assert.equal(helpers.filterRows(data.dynasties, '', 'no-such-dynasty', [-399, 1947]).length, 0);
assert(!helpers.ticks([-399, 1947]).labels.some(t => /^0 /.test(t)));
const longOnly = helpers.filterRows(data.dynasties, '', '', [-412, 1947], false);
assert(!longOnly.some(d => d.id === 'sur'));
assert(longOnly.some(d => d.id === 'mughal'));
assert.equal(longOnly.find(d => d.id === 'ahom').periods.length, 2);
assert.equal(longOnly.find(d => d.id === 'mughal').periods.length, 2);
const travancore = data.dynasties.find(d => d.id === 'travancore');
const segments = helpers.splitPeriod(travancore, travancore.periods[0]);
assert.equal(segments.length, 2);
assert.deepEqual(segments.map(p => [p.start, p.end, p.british]), [[1729, 1795, false], [1795, 1947, true]]);
assert(data.dynasties.every(d => d.wikipedia && d.wikipedia.startsWith('https://en.wikipedia.org/wiki/')));

for (const [id, source] of Object.entries(data.sources)) {
  const snapshot = path.join(root, 'data/south-asian-dynasties', source.snapshot);
  assert(fs.existsSync(snapshot), `Missing snapshot: ${id}`);
  assert(!fs.readFileSync(snapshot, 'utf8').startsWith('Internal Error'), `Failed source snapshot: ${id}`);
}
// Minimal DOM/Plotly test doubles exercise wiring, data, and async state changes.
class Element {
  constructor(id) { this.id = id; this.children = []; this.listeners = {}; this.style = {}; this.hidden = false; this.value = ''; this.offsetWidth = 260; this.offsetHeight = 70; this.scrollLeft = 0; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = [...items]; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  on(name, fn) { this.listeners[name] = fn; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 1600 }; }
  focus() {}
  scrollIntoView() {}
}
const ids = [...fs.readFileSync(path.join(root, 'history/south-asian-dynasties/index.md'), 'utf8').matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const elements = Object.fromEntries(ids.map(id => [id, new Element(id)]));
elements['dynasty-chart'].parentElement = new Element('scroll');
elements['dynasty-short'].checked = true; elements['dynasty-sort'].value = 'time'; elements['dynasty-era'].value = 'all';
let requests = [], plots = 0;
const context = {
  document: { currentScript: { dataset: { source: '/public-ledger/data/south-asian-dynasties/dynasties.json' } },
    getElementById: id => { assert(elements[id], `Unknown element ${id}`); return elements[id]; },
    createElement: tag => new Element(tag), createTextNode: text => ({ textContent: text }), addEventListener() {} },
  fetch: async url => { requests.push(url); return { ok: true, json: async () => data }; },
  console,
  Plotly: { react: async (chart, traces, layout) => { plots++; chart.data = traces; chart.layout = layout; }, restyle() {} },
};
context.window = context;
vm.runInNewContext(code, context);
const settle = () => new Promise(resolve => setImmediate(resolve));
async function change(id, value, event = 'change') { elements[id].value = value; if (id === 'dynasty-short') elements[id].checked = value; elements[id].listeners[event](); await settle(); }
(async () => {
  await settle();
  const chart = elements['dynasty-chart'];
  assert.equal(requests.length, 1); assert(requests.every(url => url.startsWith('/public-ledger/')));
  assert.equal(chart.data.flatMap(t => t.x).length, phaseCount);
  assert.equal(elements['dynasty-detail-name'].textContent, 'Maurya');
  await change('dynasty-search', 'Chola · imperial', 'input');
  assert.equal(chart.data.flatMap(t => t.customdata).join(), 'chola');
  assert.equal(elements['dynasty-choice'].children.length, 1);
  await change('dynasty-search', 'no-such-dynasty', 'input');
  assert.equal(chart.hidden, true); assert.equal(elements['dynasty-empty'].hidden, false);
  elements['dynasty-reset'].listeners.click(); await settle();
  assert.equal(chart.hidden, false); assert.equal(chart.data.flatMap(t => t.x).length, phaseCount);
  await change('dynasty-era', 'earlymodern');
  assert.deepEqual(Array.from(chart.layout.xaxis.range), [1500, 1947]);
  await change('dynasty-region', 'Northwest & Indus');
  assert(chart.data.every(t => t.name === 'Northwest & Indus'));
  chart.listeners.plotly_click({ points: [{ customdata: 'sikh' }] });
  assert.equal(elements['dynasty-detail-name'].textContent, 'Sukerchakia · Sikh Empire');
  chart.listeners.plotly_hover({ points: [{ customdata: 'sikh' }], event: { clientX: 990, clientY: 1590 } });
  assert.equal(elements['dynasty-tooltip'].hidden, false);
  assert(parseFloat(elements['dynasty-tooltip'].style.left) <= 732);
  assert(parseFloat(elements['dynasty-tooltip'].style.top) <= 1522);
  chart.listeners.plotly_unhover(); assert.equal(elements['dynasty-tooltip'].hidden, true);
  chart.listeners.plotly_relayout({ 'xaxis.range[0]': 1750, 'xaxis.range[1]': 1900 }); await settle();
  assert.deepEqual(Array.from(chart.layout.xaxis.range), [1750, 1900]);
  elements['dynasty-reset-zoom'].listeners.click(); await settle();
  assert.deepEqual(Array.from(chart.layout.xaxis.range), [1500, 1947]);
  elements['dynasty-reset'].listeners.click(); await settle();
  assert.equal(chart.data.flatMap(t => t.customdata).filter(id => id === 'mughal').length, 3);
  const previousPlots = plots;
  await change('dynasty-sort', 'time');
  assert.equal(chart.layout.annotations.length, 0); assert(plots > previousPlots);
  assert(chart.layout.yaxis.ticktext[0].includes('Shishunaga'));
  assert(chart.layout.yaxis.ticktext.every(text => !text.includes('<a')));
  assert(chart.layout.shapes.some(s => s.type === 'rect' && s.line.dash === 'dot'));
  await change('dynasty-short', false);
  assert(!chart.data.flatMap(t => t.customdata).includes('sur'));
  assert.equal(chart.data.flatMap(t => t.customdata).filter(id => id === 'mughal').length, 3);
  console.log(`Passed: ${data.dynasties.length} entries, source snapshots, BCE/CE, phase gaps, filters, sort, selection, tooltip bounds, zoom and reset wiring.`);
})().catch(error => { console.error(error); process.exitCode = 1; });

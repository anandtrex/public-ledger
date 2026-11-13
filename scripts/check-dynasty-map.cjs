'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const map = JSON.parse(read('data/south-asian-dynasties/map.json'));
const data = JSON.parse(read('data/south-asian-dynasties/dynasties.json'));
const helpers = require('../assets/js/dynasty-map.js');
const ids = new Set(data.dynasties.map(d => d.id));
assert.equal(helpers.historical(helpers.coordinate(-1)), -1);
assert.equal(helpers.historical(helpers.coordinate(1)), 1);
assert.equal(helpers.coordinate(1) - helpers.coordinate(-1), 1);
const gap = helpers.atYear(map, data.dynasties, ids, 1545);
assert(!gap.active.some(d => d.id === 'mughal'));
assert(gap.mapped.has('sur'));
const last = helpers.atYear(map, data.dynasties, ids, 1947);
assert(last.mapped.has('british-raj')); assert(!last.active.some(d => d.id === 'company'));
assert(data.dynasties.every(d => d.periods.every(p => p.end <= 1947)));
assert.equal(map.coverage_end, data.coverage_end);
assert.equal(new Set(map.territories.flatMap(t => t.dynastyIds)).size, ids.size);
for (let year = -413; year <= 1947; year += 25) {
  const state = helpers.atYear(map, data.dynasties, ids, year);
  assert.equal(state.mapped.size, state.active.length, `Missing locator at ${year}`);
  assert(state.active.every(d => ids.has(d.id)));
}
const trav = data.dynasties.find(d => d.id === 'travancore');
assert(!helpers.princelyAt(trav, 1794)); assert(helpers.princelyAt(trav, 1795));
assert(!helpers.princelyAt(data.dynasties.find(d => d.id === 'shah-nepal'), 1900));
assert(helpers.atYear(map, data.dynasties, ids, 1900, true).mapped.has('travancore'));
assert(!helpers.atYear(map, data.dynasties, ids, 1900, false).mapped.has('travancore'));
assert(helpers.atYear(map, data.dynasties, ids, 1941, false).mapped.has('travancore'));
assert(helpers.atYear(map, data.dynasties, ids, 1750).mapped.has('bhonsle'));
assert(helpers.atYear(map, data.dynasties, ids, 1947).territories.some(t => t.dynastyIds.includes('british-raj') && t.labelArea > 100));
assert(!read('assets/js/dynasty-map.js').includes('fillpattern'));

for (const t of map.territories) {
  assert(t.start <= t.end && t.dynastyIds.every(id => ids.has(id)));
  const points = helpers.paths(t.geometry);
  assert.equal(points.x.length, points.y.length);
  assert(points.x.every(x => x === null || (x >= 60 && x <= 99)));
  assert(points.y.every(y => y === null || (y > 5 && y < 39)));
}
class Element {
  constructor(id) { this.id = id; this.children = []; this.listeners = {}; this.attributes = {}; this.style = { setProperty() {} }; this.value = ''; this.hidden = false; this.offsetWidth = 240; this.offsetHeight = 70; this.scrollLeft = 0; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = [...items]; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, fn) { this.listeners[key] = fn; }
  on(key, fn) { this.listeners[key] = fn; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 450 }; }
}
const elements = Object.fromEntries([...read('history/south-asian-dynasties/index.md').matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element(m[1])]));
elements['dynasty-chart'].parentElement = new Element('chart-scroll');
elements['dynasty-map'].parentElement = new Element('map-wrap');
elements['dynasty-short'].checked = true; elements['dynasty-sort'].value = 'time'; elements['dynasty-era'].value = 'all';
elements['dynasty-map-uncertain'].checked = true; elements['dynasty-map-names'].checked = true; elements['dynasty-map-step'].value = '10';
let calls = [], queued = new Map(), sequence = 0, requests = [];
const context = {
  document: { currentScript: { dataset: { source: '/data/dynasties.json', mapSource: '/data/map.json' } },
    getElementById: id => { assert(elements[id], `Unknown DOM element ${id}`); return elements[id]; },
    createElement: tag => new Element(tag), createTextNode: text => ({ textContent: text }), addEventListener() {} },
  fetch: async url => { requests.push(url); return { ok: true, json: async () => url.endsWith('/map.json') ? map : data }; },
  console, setTimeout: fn => { queued.set(++sequence, fn); return sequence; }, clearTimeout: id => queued.delete(id),
  Plotly: { react: async (chart, traces, layout) => { chart.data = traces; chart.layout = layout; },
    restyle() {}, relayout: (chart, layout) => { Object.assign(chart.layout, layout); calls.push(layout); } },
};
context.window = context;
vm.runInNewContext(read('assets/js/dynasty-map.js'), context);
vm.runInNewContext(read('assets/js/south-asian-dynasties.js'), context);
const settle = () => new Promise(resolve => setImmediate(resolve));
async function change(id, value, event = 'change') { elements[id].value = value; elements[id].listeners[event](); await settle(); }
(async () => {
  await settle(); await settle();
  assert.equal(requests.length, 2); assert(requests.every(url => url.startsWith('/data/')));
  assert.equal(elements['dynasty-map-date'].textContent, '413 BCE');
  assert(elements['dynasty-map'].data.some(t => t.meta && t.meta.name));
  assert(calls.some(c => c.shapes && c.shapes.some(s => s.type === 'line' && s.x0 === -412)));
  await change('dynasty-map-year', '1947');
  assert.equal(elements['dynasty-map-date'].textContent, '1947 CE');
  assert(elements['dynasty-map'].data.some(t => t.meta && t.meta.ids.includes('british-raj')));
  assert.equal(elements['dynasty-map-next'].disabled, true);
  await change('dynasty-map-year', '2500'); assert.equal(elements['dynasty-map-date'].textContent, '1947 CE');
  await change('dynasty-map-slider', '0', 'input'); assert.equal(elements['dynasty-map-date'].textContent, '1 BCE');
  elements['dynasty-map-step'].value = '1'; elements['dynasty-map-next'].listeners.click(); await settle();
  assert.equal(elements['dynasty-map-date'].textContent, '1 CE');
  await change('dynasty-search', 'Chola · imperial', 'input');
  await change('dynasty-choice', 'chola'); await settle();
  assert(elements['dynasty-map'].data.filter(t => t.meta).every(t => t.meta.ids.every(id => id === 'chola')));
  assert(elements['dynasty-map-active'].children[0].children[0].textContent.includes('Chola'));
  elements['dynasty-reset'].listeners.click(); await settle();
  await change('dynasty-map-year', '1940'); elements['dynasty-map-step'].value = '10';
  elements['dynasty-map-play'].listeners.click();
  assert.equal(elements['dynasty-map-play'].textContent, 'Pause');
  const first = [...queued.entries()][0]; queued.delete(first[0]); await first[1](); await settle();
  assert.equal(elements['dynasty-map-date'].textContent, '1947 CE');
  const end = [...queued.entries()][0]; queued.delete(end[0]); await end[1]();
  assert.equal(elements['dynasty-map-play'].textContent, 'Play');
  assert.equal(queued.size, 0);
  elements['dynasty-map-play'].listeners.click();
  await change('dynasty-region', 'British rule');
  assert.equal(queued.size, 0); assert.equal(elements['dynasty-map-play'].textContent, 'Play');
  await change('dynasty-map-year', '1900');
  const active = elements['dynasty-map-active'].children[0].children[0]; active.listeners.click(); await settle();
  assert.equal(elements['dynasty-detail-name'].textContent, 'British Raj · Crown rule');
  assert(elements['dynasty-map'].data.filter(t => t.meta).every(t => t.meta.ids.every(id => ['company', 'british-raj'].includes(id))));
  console.log('Passed map geometry references, 1947 cutoff and British coverage, BCE/CE, phase gaps, linked selection and year guide, filters, animation pause/end/restart.');
})().catch(error => { console.error(error); process.exitCode = 1; });

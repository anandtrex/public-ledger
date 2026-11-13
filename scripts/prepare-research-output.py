"""Build the local research-output snapshot from downloaded source files."""
import csv
import gzip
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPENDING = ROOT / 'data/income-and-research'
OUTPUT = ROOT / 'data/research-output'
countries = {r['id']: r for r in json.loads((SPENDING / 'countries.json').read_text())[1]
             if r['region']['id'] != 'NA' and r['region']['value'] != 'Aggregates'}
gdp = {(r['countryiso3code'], int(r['date'])): r['value']
       for r in json.loads((SPENDING / 'gdp-total.json').read_text())[1]
       if r['value'] is not None and r['value'] > 0}
records = {}
for r in csv.DictReader((SPENDING / 'research-spending-gdp.csv').open()):
    key = (r['Code'], int(r['Year']))
    value = r['Research and development expenditure (% of GDP)'].strip()
    if key[0] not in countries or not value or key not in gdp or not 2010 <= key[1] <= 2023:
        continue
    country = countries[key[0]]
    records[key] = dict(code=key[0], country=country['name'], year=key[1],
                        region=country['region']['value'].strip(), share=float(value),
                        spending=float(value) / 100 * gdp[key], gdp=gdp[key], output={})
metrics = {'FPUBS_NBFRAC': 'publications', 'TOP10FPUBS_NBFRAC': 'top10',
           'TOP10_X': 'top10share', 'NORMCIT_X': 'impact'}
fields = {}
with gzip.open(OUTPUT / 'oecd-fields.csv.gz', 'rt') as source:
    for r in csv.DictReader(source):
        key = (r['REF_AREA'], int(r['TIME_PERIOD']))
        if key not in records or r['MEASURE'] not in metrics or not r['OBS_VALUE'].strip():
            continue
        field = r['ASJC']
        assert len(field) == 2, 'Expected broad research disciplines'
        fields[field] = r['All Science Journal Classification'].replace(' (all)', '')
        value = float(r['OBS_VALUE'])
        assert math.isfinite(value)
        output = records[key]['output'].setdefault(field, {})
        metric = metrics[r['MEASURE']]
        assert metric not in output, 'Duplicate country/year/field/metric'
        output[metric] = value
rows = [r for r in records.values() if r['output']]
for r in rows:
    for output in r['output'].values():
        if all(k in output for k in ('publications', 'top10', 'top10share')) and output['publications'] > 0:
            assert abs(output['top10'] / output['publications'] * 100 - output['top10share']) < 0.02
snapshot = dict(downloaded='2026-11-13', fields=fields, records=rows)
(OUTPUT / 'output.json').write_text(json.dumps(snapshot, separators=(',', ':'), allow_nan=False) + '\n')
print(f'Prepared {len(rows)} country-year records and {len(fields)} research fields.')

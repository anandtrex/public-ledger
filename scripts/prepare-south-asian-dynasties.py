#!/usr/bin/env python3
"""Validate the editorial chronology and build the browser snapshot, without network access."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/south-asian-dynasties'
REGIONS = ['Northwest & Indus', 'North & Gangetic plain', 'Bengal & Northeast',
           'Deccan & West', 'South & East coast', 'British rule', 'Nepal & Bhutan', 'Other colonial rule']


def prepare():
    rows = json.loads((DATA / 'source/dynasties.json').read_text())
    sources = json.loads((DATA / 'sources.json').read_text())
    seen = set()
    for row in rows:
        assert row['id'] not in seen, f"Duplicate ID: {row['id']}"
        seen.add(row['id'])
        assert row['region'] in REGIONS
        assert row['name'] and row['area'] and row['sources'] and row['periods']
        assert isinstance(row['approximate'], bool)
        previous_end = -10000
        for period in row['periods']:
            start, end = period['start'], period['end']
            assert isinstance(start, int) and isinstance(end, int)
            assert start != 0 and end != 0, 'Historical dating has no year zero'
            assert -600 <= start < end <= 1950
            assert start > previous_end, f"Overlapping phases: {row['id']}"
            previous_end = end
        assert all(source in sources for source in row['sources'])
    displayed = []
    for row in rows:
        entry = dict(row)
        entry['periods'] = [dict(start=p['start'], end=min(p['end'], 1947)) for p in row['periods'] if p['start'] <= 1947]
        entry['longest_reign'] = max((p['end'] - p['start'] - (1 if p['start'] < 0 < p['end'] else 0)) for p in entry['periods'])
        displayed.append(entry)
    result = dict(coverage_end=1947, updated='2026-11-13', regions=REGIONS, sources=sources, dynasties=displayed)
    (DATA / 'dynasties.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f'Prepared {len(rows)} dynasties and {sum(len(r["periods"]) for r in rows)} phases.')


if __name__ == '__main__':
    prepare()

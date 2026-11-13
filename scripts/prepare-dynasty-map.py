#!/usr/bin/env python3
"""Offline Cliopatria subset -> clipped, simplified map payload.

Install scripts/requirements-dynasty-map.txt in a virtual environment first.
"""
import gzip
import hashlib
import json
import numpy as np
from pathlib import Path
from shapely import make_valid
from shapely.geometry import shape, mapping, box, Polygon, MultiPolygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

DATA = Path(__file__).resolve().parents[1] / 'data/south-asian-dynasties'
BOUNDS = [60, 5.5, 99, 38.5]


def polygons(geometry):
    if isinstance(geometry, Polygon):
        return [geometry]
    if hasattr(geometry, 'geoms'):
        return [p for g in geometry.geoms for p in polygons(g)]
    return []


def encode(geometry):
    parts = [orient(p, sign=1) for p in polygons(make_valid(geometry)) if p.area >= .0001]
    if not parts:
        return None
    geometry = MultiPolygon(parts)
    raw = json.loads(json.dumps(mapping(geometry)), parse_float=lambda x: round(float(x), 4))
    # Rounding may collapse tiny pieces. Repair and filter again before serialising.
    parts = [orient(p, sign=1) for p in polygons(make_valid(shape(raw))) if p.area >= .0001]
    if not parts:
        return None
    return mapping(MultiPolygon(parts))


def prepare():
    metadata = json.loads((DATA / 'map-sources.json').read_text())
    source = gzip.decompress((DATA / 'source/cliopatria-matched.geojson.gz').read_bytes())
    assert hashlib.sha256(source).hexdigest() == metadata['cliopatria']['subset_sha256']
    natural = gzip.decompress((DATA / 'source/natural-earth-countries.geojson.gz').read_bytes())
    assert hashlib.sha256(natural).hexdigest() == metadata['natural_earth']['sha256']
    countries = json.loads(natural)['features']
    scope = [f for f in countries if f['properties']['ADM0_A3'] in ('IND', 'PAK', 'BGD', 'NPL', 'BTN')]
    assert len(scope) == 5
    mask = unary_union([make_valid(shape(f['geometry'])) for f in scope])
    viewport = box(*BOUNDS)
    matches = json.loads((DATA / 'source/map-matches.json').read_text())
    dynasties = {d['id']: d for d in json.loads((DATA / 'dynasties.json').read_text())['dynasties']}
    assert set(matches) <= set(dynasties)
    names = {n for match in matches.values() for n in match['names']}
    observed = set()
    territories = []
    for feature in json.loads(source)['features']:
        p = feature['properties']
        assert p['Name'] in names and p['Type'] == 'POLITY'
        observed.add(p['Name'])
        ids = [id for id, match in matches.items() if p['Name'] in match['names'] and any(
            phase['start'] <= p['ToYear'] and phase['end'] >= p['FromYear'] for phase in dynasties[id]['periods'])]
        if not ids:
            continue
        geometry = make_valid(shape(feature['geometry'])).intersection(mask).simplify(.015, preserve_topology=True)
        encoded = encode(geometry)
        if not encoded:
            continue
        for polygon in polygons(shape(encoded)):
            assert polygon.is_valid
        point = max(polygons(shape(encoded)), key=lambda p: p.area).representative_point()
        territories.append(dict(id=feature['source_index'], name=p['Name'], start=p['FromYear'], end=p['ToYear'],
                                dynastyIds=ids, kind='generalized', source='cliopatria', note='Generalized historical polygon from Cliopatria.', geometry=encoded, label=[round(point.x, 4), round(point.y, 4)],
                                labelArea=round(geometry.area, 3)))
    assert observed == names, f'Missing polity names: {names - observed}'
    references = json.loads((DATA / 'source/reference-matches.json').read_text())
    original_1941 = gzip.decompress((DATA / 'source/india-1941.geojsonl.gz').read_bytes())
    assert hashlib.sha256(original_1941).hexdigest() == metadata['india_1941']['sha256']
    districts = [json.loads(line) for line in original_1941.decode().splitlines()]
    def add_geometry(id, geometry, kind, note, source, reference_year=None):
        encoded = encode(make_valid(geometry).intersection(mask).simplify(.015, preserve_topology=True))
        if not encoded:
            return
        geometry = shape(encoded)
        point = max(polygons(geometry), key=lambda p: p.area).representative_point()
        for i, period in enumerate(dynasties[id]['periods']):
            territories.append(dict(id=f'{kind}-{id}-{i}', name=dynasties[id]['name'],
                start=period['start'], end=period['end'], dynastyIds=[id], geometry=encoded,
                kind=kind, source=source, referenceYear=reference_year, note=note,
                label=[round(point.x, 4), round(point.y, 4)], labelArea=round(geometry.area, 3)))
    for id, properties in references.items():
        found = [f for f in districts if all(f['properties'].get(key) == value for key, value in properties.items())]
        assert found, f'Missing 1941 state: {id}'
        add_geometry(id, unary_union([make_valid(shape(f['geometry'])) for f in found]), 'reference',
            '1941 reference footprint. In other years this is a geographic locator, not a reconstructed frontier.', 'india-1941', 1941)
    for feature in json.loads((DATA / 'source/schematic-cores.geojson').read_text())['features']:
        properties = feature['properties']
        add_geometry(properties['dynasty'], shape(feature['geometry']), 'core', properties['note'], 'editorial-core')
    trace = json.loads((DATA / 'source/ahom-map-trace.json').read_text())
    control = np.array([p['pixel'] + [1] for p in trace['control_points']])
    destinations = np.array([p['lonlat'] for p in trace['control_points']])
    affine = np.linalg.solve(control, destinations)
    ring = np.array([p + [1] for p in trace['pixel_vertices']]) @ affine
    before = len(territories)
    add_geometry('ahom', Polygon(ring), 'reference', trace['note'], 'commons-ahom', trace['reference_year'])
    territories[before]['start'], territories[before]['end'] = trace['display_period']
    del territories[before + 1:]
    background = []
    for f in countries:
        geometry = shape(f['geometry']).intersection(viewport).simplify(.02, preserve_topology=True)
        encoded = encode(geometry)
        if encoded:
            background.append(dict(name=f['properties']['ADMIN'], code=f['properties']['ADM0_A3'], geometry=encoded))
    result = dict(coverage_end=1947, updated=metadata['checked'], bounds=BOUNDS, matches=matches, territories=territories,
                  background=background, scope=encode(mask.simplify(.01, preserve_topology=True)))
    (DATA / 'map.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    coverage = {id: sum(id in t['dynastyIds'] for t in territories) for id in dynasties}
    (DATA / 'map-coverage.json').write_text(json.dumps(coverage, indent=2) + '\n')
    print(f'Prepared {len(territories)} boundary records for {sum(v > 0 for v in coverage.values())}/{len(dynasties)} entries.')


if __name__ == '__main__':
    prepare()

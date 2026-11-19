"""Validate hand-authored geomorph blueprints without third-party dependencies.

Usage: python validate.py [path/to/blueprints.json]
"""
import collections
import json
import sys
from pathlib import Path

SIZE = 20
PORTALS = {(4,0),(15,0),(0,4),(19,4),(0,15),(19,15),(4,19),(15,19)}
NEIGHBORS = ((1,0),(-1,0),(0,1),(0,-1))

def pair(a,b):
    return tuple(sorted((a,b)))

def rotate(p,turns):
    x,y=p
    for _ in range(turns%4):x,y=19-y,x
    return (x,y)

def connected(cells,blocked,start):
    found={start};queue=collections.deque([start])
    while queue:
        x,y=queue.popleft()
        for dx,dy in NEIGHBORS:
            q=(x+dx,y+dy)
            if q in cells and q not in found and pair((x,y),q) not in blocked:
                found.add(q);queue.append(q)
    return found

def footprint(shape):
    if isinstance(shape, dict):
        rows = shape['rows']
    else:
        x1, y1, x2, y2 = shape
        rows = [[y, x1, x2] for y in range(y1, y2 + 1)]
    cells = set()
    for y, x1, x2 in rows:
        assert all(isinstance(n, int) for n in (y, x1, x2)) and 0 <= y < SIZE and 0 <= x1 <= x2 < SIZE, ('invalid chamber run', y, x1, x2)
        for x in range(x1, x2 + 1):
            assert (x, y) not in cells, ('overlapping chamber run', x, y)
            cells.add((x, y))
    assert cells and connected(cells, set(), next(iter(cells))) == cells, 'disconnected chamber footprint'
    return cells

def validate_terrain(tile, cells):
    """Independent blueprint validation for terrain used by the vector renderer."""
    spec = tile.get('terrain', {})
    assert isinstance(spec, dict), (tile['id'], 'invalid terrain')
    def coords(points, name):
        assert isinstance(points, list), (tile['id'], name, 'not a list')
        result = []
        for p in points:
            assert isinstance(p, list) and len(p) == 2, (tile['id'], name, p)
            assert all(type(v) is int for v in p), (tile['id'], name, p)
            q = tuple(p)
            assert q in cells, (tile['id'], name, 'outside floor', q)
            result.append(q)
        assert len(result) == len(set(result)), (tile['id'], 'duplicate', name)
        return set(result)
    water = coords(spec.get('water', []), 'water')
    bridge = coords(spec.get('bridges', []), 'bridges')
    assert bridge <= water, (tile['id'], 'bridge without water')
    levels = {}
    for group in spec.get('elevations', []):
        assert isinstance(group, list) and len(group) == 2, (tile['id'], 'elevation')
        z, points = group
        assert type(z) is int and z != 0, (tile['id'], 'elevation level')
        for p in coords(points, 'elevation'):
            assert p not in levels, (tile['id'], 'overlapping elevations', p)
            levels[p] = z
    ramps = set()
    for pair_of_cells in spec.get('ramps', []):
        assert isinstance(pair_of_cells, list) and len(pair_of_cells) == 2, (tile['id'], 'ramp')
        a, b = (next(iter(coords([p], 'ramp'))) for p in pair_of_cells)
        assert abs(a[0]-b[0])+abs(a[1]-b[1]) == 1, (tile['id'], 'nonadjacent ramp')
        assert abs(levels.get(a, 0)-levels.get(b, 0)) == 1, (tile['id'], 'ramp must join consecutive levels')
        e = pair(a, b)
        assert e not in ramps, (tile['id'], 'duplicate ramp')
        ramps.add(e)
    assert not ((water | set(levels)) & PORTALS), (tile['id'], 'terrain changes tile edge')
    remaining = set(bridge)
    while remaining:
        start = remaining.pop()
        group = {start}
        todo = [start]
        while todo:
            x, y = todo.pop()
            for dx, dy in NEIGHBORS:
                q = (x+dx, y+dy)
                if q in remaining:
                    remaining.remove(q)
                    group.add(q)
                    todo.append(q)
        xs = {p[0] for p in group}
        ys = {p[1] for p in group}
        assert len(xs) == 1 or len(ys) == 1, (tile['id'], 'bent bridge span')
        assert len(group) == max(len(xs), len(ys)), (tile['id'], 'disconnected bridge span')
    return {'water_cells': len(water), 'bridges': len(bridge), 'raised_cells': len(levels), 'ramps': len(ramps)}


def validate_vertical(tile, cells):
    """Independent validation of real stacked floors, not height annotations."""
    spec = tile.get('vertical', {})
    assert isinstance(spec, dict), (tile['id'], 'invalid vertical geometry')
    decks = spec.get('decks', [])
    links = spec.get('links', [])
    assert isinstance(decks, list) and isinstance(links, list), (tile['id'], 'invalid deck/link lists')
    levels = {}
    for z, positions in tile.get('terrain', {}).get('elevations', []):
        for p in positions:
            levels[tuple(p)] = z
    base = {(x,y,levels.get((x,y),0)) for x,y in cells}
    stacked = set()
    deck_ids = set()
    for deck in decks:
        assert isinstance(deck, dict), (tile['id'], 'invalid deck')
        name, z, coordinates = deck.get('id'), deck.get('level'), deck.get('cells')
        assert isinstance(name, str) and name and name[0].islower() and all(
            c.islower() or c.isdigit() or c in '_-' for c in name), (tile['id'], 'invalid deck id')
        assert name not in deck_ids and type(z) is int and z != 0, (tile['id'], 'duplicate deck or invalid level')
        assert isinstance(coordinates, list) and coordinates, (tile['id'], 'empty deck')
        deck_ids.add(name)
        points = set()
        for p in coordinates:
            assert isinstance(p, list) and len(p) == 2 and all(type(n) is int for n in p), (tile['id'], 'invalid deck coordinate')
            x,y = p
            assert (x,y) in cells and 0 < x < 19 and 0 < y < 19, (tile['id'], 'deck changes edge or leaves floor')
            assert (x,y) not in points and (x,y,z) not in stacked and (x,y,z) not in base, (tile['id'], 'deck overlap')
            points.add((x,y))
            stacked.add((x,y,z))
        assert connected(points,set(),next(iter(points))) == points, (tile['id'], 'disconnected deck')
    graph = collections.defaultdict(set)
    for x,y,z in stacked:
        for dx,dy in NEIGHBORS:
            q=(x+dx,y+dy,z)
            if q in stacked:
                graph[(x,y,z)].add(q)
    seen_links=set()
    for link in links:
        assert isinstance(link, dict) and link.get('kind') in ('ladder','stair'), (tile['id'], 'invalid link')
        p=link.get('at')
        a,b=link.get('from'),link.get('to')
        assert isinstance(p,list) and len(p)==2 and all(type(n) is int for n in p), (tile['id'], 'invalid link position')
        assert type(a) is int and type(b) is int and a!=b, (tile['id'], 'invalid link levels')
        assert link['kind']!='stair' or abs(a-b)==1, (tile['id'], 'impossible stair')
        x,y=p
        u,v=(x,y,a),(x,y,b)
        assert (u in stacked or u in base) and (v in stacked or v in base), (tile['id'], 'link to missing floor')
        assert u in stacked or v in stacked, (tile['id'], 'link does not serve deck')
        e=tuple(sorted((u,v)))
        assert e not in seen_links, (tile['id'], 'duplicate link')
        seen_links.add(e)
        graph[u].add(v)
        graph[v].add(u)
    assert not decks or links, (tile['id'], 'floating decks')
    reached=set(base)
    todo=list(base)
    for u in todo:
        for v in graph[u]:
            if v not in reached:
                reached.add(v)
                todo.append(v)
    assert stacked <= reached, (tile['id'], 'unreachable stacked cells')
    return {'stacked_decks':len(decks), 'stacked_floor_cells':len(stacked), 'vertical_connections':len(links)}


def validate_waterworks(tile, cells):
    """Independent sanity check: hydraulic canals cannot consume normal halls."""
    spec = tile.get('hydrology', {})
    if 'channels' not in spec:
        return {'engineered_channel_cells': 0, 'sluice_controls': 0}
    channel_positions = [tuple(p) for p in spec['channels']]
    channels = set(channel_positions)
    assert channels and len(channels) == len(channel_positions), (tile['id'], 'duplicate/empty waterway')
    assert channels <= set(cells) and not channels & PORTALS, (tile['id'], 'invalid channel')
    water = {tuple(p) for p in tile.get('terrain', {}).get('water', [])}
    assert water <= channels, (tile['id'], 'water escapes channel')
    inlet = tuple(spec['intake'])
    outlet = tuple(spec['outlet'])
    assert inlet in water and outlet in channels and inlet != outlet, (tile['id'], 'bad hydraulic terminals')

    gates, edges = {}, set()
    for gate in spec.get('gates', []):
        a, b = tuple(gate['a']), tuple(gate['b'])
        edge = pair(a, b)
        assert (gate.get('kind') == 'sluice'
                and gate.get('default') in ('closed', 'open')
                and gate['id'] not in gates and edge not in edges
                and a in channels and b in channels
                and sum(abs(n-m) for n, m in zip(a, b)) == 1
                and all(0 < n < 19 for p in (a, b) for n in p)), (tile['id'], 'invalid channel sluice')
        gates[gate['id']] = gate
        edges.add(edge)

    # With every shutter opened, the intake must lead to the receiving sump.
    assert outlet in connected(channels, set(), inlet), (tile['id'], 'disconnected race')
    assigned, locations = set(), set()
    for station in spec.get('controls', []):
        at = tuple(station['at'])
        assert (station.get('kind') == 'handwheel'
                and station.get('gate') in gates and station['gate'] not in assigned
                and at in cells and cells[at] == 'hall'
                and at not in water and at not in locations and at not in PORTALS), (tile['id'], 'invalid gate station')
        assigned.add(station['gate'])
        locations.add(at)
    if 'controls' in spec:
        assert assigned == set(gates), (tile['id'], 'uncontrolled shutter')
    return {'engineered_channel_cells': len(channels), 'sluice_controls': len(locations)}

def validate(tile):
    name=tile['id'];cells={};chambers={}
    for key,title,shape in tile['rooms']:
        assert key not in chambers,(name,'duplicate chamber',key)
        footprint_cells=footprint(shape)
        chambers[key]=(min(x for x,y in footprint_cells),min(y for x,y in footprint_cells),max(x for x,y in footprint_cells),max(y for x,y in footprint_cells))
        for p in footprint_cells:
            assert p not in cells,(name,'overlapping rooms',p)
            cells[p]=key
    for route in tile['routes']:
        points=route['points']
        assert len(points)>=2,(name,'short route',route['id'])
        for (x,y),(xx,yy) in zip(points,points[1:]):
            assert x==xx or y==yy,(name,'diagonal route',route['id'])
            for i in range(min(x,xx),max(x,xx)+1):
                for j in range(min(y,yy),max(y,yy)+1):
                    assert 0<=i<20 and 0<=j<20,(name,'route outside map')
                    assert (i,j) not in cells or cells[(i,j)]=='hall',(name,'route intersects room',route['id'],i,j)
                    cells[(i,j)]='hall'
    boundary={p for p in cells if 0 in p or 19 in p}
    assert boundary==PORTALS,(name,'invalid edge openings',boundary^PORTALS)
    terrain_report = validate_terrain(tile, cells)
    vertical_report = validate_vertical(tile, cells)
    walls=set()
    for (x,y),zone in cells.items():
        for dx,dy in NEIGHBORS:
            q=(x+dx,y+dy)
            if q in cells and cells[q]!=zone:walls.add(pair((x,y),q))
    doors=set();by_room=collections.Counter()
    for room,side,offset,kind in tile['doors']:
        assert room in chambers and kind in ('door','secret','locked')
        x1,y1,x2,y2=chambers[room]
        if side=='N':a,b=(offset,y1),(offset,y1-1)
        elif side=='S':a,b=(offset,y2),(offset,y2+1)
        elif side=='W':a,b=(x1,offset),(x1-1,offset)
        elif side=='E':a,b=(x2,offset),(x2+1,offset)
        else:raise AssertionError((name,'invalid doorway direction'))
        e=pair(a,b)
        assert cells.get(a)==room and cells.get(b)=='hall' and e in walls and e not in doors,(name,'invalid door',room,side,offset)
        doors.add(e);by_room[room]+=1
    assert len(doors)<=max(8,2*len(chambers)) and all(by_room[key] for key in chambers),(name,'door budget')
    assert connected(cells,walls-doors,(4,0))==set(cells),(name,'disconnected walkable regions')
    hall={p for p,z in cells.items() if z=='hall'}
    assert connected(hall,set(),(4,0))==hall,(name,'disconnected corridors')
    links=sum(((x+dx,y+dy) in hall) for x,y in hall for dx,dy in ((1,0),(0,1)))
    loops=links-len(hall)+1
    assert loops>=3,(name,'insufficient alternate routes',loops)
    waterworks_report = validate_waterworks(tile, cells)
    return {'id':name,'rooms':len(chambers),'doors':len(doors),'corridor_cycles':loops,'floor_cells':len(cells),**terrain_report,**vertical_report,**waterworks_report}

def main():
    data=json.loads(Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).with_name('blueprints.json')).read_text())
    assert {rotate(p,r) for p in PORTALS for r in range(4)}==PORTALS,'portals are not rotation-invariant'
    reports=[validate(t) for t in data['tiles']]
    for r in reports:print(f"PASS {r['id']}: {r['rooms']} chambers, {r['doors']} doors, {r['corridor_cycles']} hall loops")
    print(f"PASS {len(reports)} geomorphs; exact edge mask survives all quarter-turns")

if __name__=='__main__':main()

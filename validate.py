"""Validate hand-authored geomorph blueprints without third-party dependencies.

Usage: python validate.py [path/to/blueprints.json]
"""
import collections
import json
import math
import sys
from pathlib import Path
from maintenance_validation import check_maintenance

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
    barriers = set()
    for item in spec.get('barriers', []):
        assert isinstance(item, list) and len(item) == 2, (tile['id'], 'invalid masonry partition')
        a, b = (next(iter(coords([p], 'barrier'))) for p in item)
        edge = pair(a, b)
        assert (abs(a[0]-b[0])+abs(a[1]-b[1]) == 1 and a not in PORTALS
                and b not in PORTALS and edge not in barriers and edge not in ramps), (tile['id'], 'invalid partition edge')
        barriers.add(edge)
    ruins = set()
    for item in spec.get('ruins', []):
        assert isinstance(item, list) and len(item) == 2, (tile['id'], 'invalid fallen masonry')
        a, b = (next(iter(coords([p], 'ruin'))) for p in item)
        edge = pair(a, b)
        assert edge in barriers and edge not in ruins, (tile['id'], 'fallen masonry must block a unique edge')
        ruins.add(edge)
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
    return {'water_cells': len(water), 'bridges': len(bridge), 'raised_cells': len(levels), 'ramps': len(ramps), 'barriers': len(barriers), 'ruined_wall_edges':len(ruins)}


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
        assert len({cells[p] for p in points}) == 1, (tile['id'], 'upper deck crosses unmodeled room wall')
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



def lower_edge_point(edge):
    assert isinstance(edge, dict) and edge.get('kind') == 'underfloor_tailrace', 'lower interface kind'
    side, offset = edge.get('side'), edge.get('offset')
    assert side in ('N', 'E', 'S', 'W') and type(offset) is int and 0 < offset < 19, 'lower interface position'
    return {'N': (offset, 0), 'S': (offset, 19),
            'W': (0, offset), 'E': (19, offset)}[side]


def validate_lower_grade(route, grade, vented=False):
    """Independent envelope audit; does not claim steady-flow hydraulic capacity."""
    def finite(value):
        return type(value) in (int, float) and math.isfinite(value)
    assert isinstance(grade, dict), 'lower grade missing'
    z = grade.get('inverts_ft')
    assert isinstance(z, list) and len(z) == len(route) and all(finite(v) for v in z), 'lower inverts'
    assert all(0 < a-b <= .25 for a,b in zip(z,z[1:])), 'lower invert must fall at each 2.5-foot station'
    crown, tailwater = grade.get('crown_ft'), grade.get('max_tailwater_ft')
    assert finite(crown) and finite(tailwater) and crown > max(z) and tailwater > max(z), 'invert/roof datum'
    assert crown-tailwater >= .5, 'insufficient collector freeboard'
    if vented:
        lip, minimum = grade.get('drop_lip_ft'), grade.get('minimum_air_gap_ft')
        assert finite(lip) and finite(minimum) and minimum >= 2, 'invalid vented drop'
        assert lip > crown and lip-tailwater >= minimum, 'assumed backwater drowns the air break'
    return z


def validate_subfloor_relay(tile):
    """A mapped outfall lip is not evidence of a functioning external watercourse."""
    lower = tile.get('hydrology', {}).get('subfloor_relay')
    if lower is None:
        return 0
    assert (isinstance(lower, dict) and type(lower.get('level')) is int and lower['level'] == -1
            and lower.get('role') == 'receiving_relay'
            and lower.get('discharge_status') == 'external_lip_receiver_unmapped'), 'unproven lower discharge'
    entry = lower_edge_point(lower.get('entry_edge'))
    route = lower.get('cells')
    assert isinstance(route, list) and len(route) >= 3, 'receiving conduit path'
    points = []
    for i, p in enumerate(route):
        assert (isinstance(p, list) and len(p) == 2 and all(type(n) is int for n in p)), 'relay coordinate'
        p = tuple(p)
        assert (p == entry if i == 0 else
                all(0 <= n <= 19 for n in p) if i == len(route)-1 else
                all(0 < n < 19 for n in p)), 'relay must enter and leave through specified boundaries only'
        points.append(p)
    assert len(points) == len(set(points)), 'relay loops'
    assert all(sum(abs(a-b) for a,b in zip(p,q)) == 1 for p,q in zip(points,points[1:])), 'relay is disconnected'
    assert tuple(lower.get('terminus', [])) == points[-1], 'relay terminus'
    z = validate_lower_grade(points, lower.get('grade'))
    o = lower.get('outfall')
    assert isinstance(o, dict) and o.get('kind') == 'masonry_arch_lip', 'missing masonry outfall'
    edge = o.get('exit_edge')
    assert isinstance(edge, dict) and edge.get('kind') == 'subfloor_outfall', 'outfall edge type'
    side, offset = edge.get('side'), edge.get('offset')
    assert side in ('N', 'E', 'S', 'W') and type(offset) is int and 0 < offset < 19, 'outfall offset'
    boundary = {'N': (offset, 0), 'S': (offset, 19),
                'W': (0, offset), 'E': (19, offset)}[side]
    assert points[-1] == boundary == tuple(o.get('at', [])), 'outfall not on boundary lip'
    assert o.get('receiver_documentation') == 'unmapped_external_watercourse', 'unjustified receiver'
    width = o.get('nominal_clear_width_ft')
    assert type(width) in (int, float) and math.isfinite(width) and 0 < width <= 2.5, 'lip too wide for half cell'
    levels = o.get('water_levels_ft')
    assert isinstance(levels, dict), 'missing receiver water assumptions'
    ordinary, high = levels.get('ordinary'), levels.get('high')
    assert all(type(v) in (int,float) and math.isfinite(v) for v in (ordinary,high)), 'invalid receiver levels'
    g = lower['grade']
    assert (z[-1] < ordinary < g['max_tailwater_ft'] < g['crown_ft'] < high), 'normal versus drowned-lip envelope'
    return len(points)


def validate_buried_foundations(tile):
    """Plan-only structural exclusion; no claim about actual foundation depths."""
    hyd = tile.get('hydrology', {})
    if 'tailrace' in hyd and 'subfloor_relay' in hyd:
        raise AssertionError('two conduit roles on one tile')
    spec = hyd.get('tailrace') or hyd.get('subfloor_relay')
    if not spec:
        return {'buried_foundation_overlaps': 0, 'buried_foundation_warnings': 0}
    footprints = {}
    for room_id, _, shape in tile['rooms']:
        for p in footprint(shape):
            assert p not in footprints, (tile['id'], 'overlapping chamber foundations')
            footprints[p] = room_id
    drops = {tuple(p) for p in hyd.get('tailrace', {}).get('pickups', [])}
    near = 0
    for station in spec['cells']:
        p = tuple(station)
        room = footprints.get(p)
        if room is not None:
            assert room == 'turbine' and p in drops, (tile['id'], 'buried route cuts room foundation', p, room)
        elif any((p[0]+dx, p[1]+dy) in footprints for dx,dy in NEIGHBORS):
            near += 1
    return {'buried_foundation_overlaps': 0, 'buried_foundation_warnings': near}


def validate_waterworks(tile, cells):
    """Independent sanity check: hydraulic canals cannot consume normal halls."""
    spec = tile.get('hydrology', {})
    lower_relay_cells = validate_subfloor_relay(tile)
    foundation_report = validate_buried_foundations(tile)
    if 'channels' not in spec:
        return {'engineered_channel_cells': 0, 'sluice_controls': 0,
                'lower_relay_cells': lower_relay_cells, **foundation_report}
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

    # Channels do not transmit water through unrelated room walls. A cut-through
    # must be an explicit culvert edge, never implicitly a pedestrian doorway.
    walls = {pair(p, (p[0]+dx, p[1]+dy))
             for p in channels for dx, dy in NEIGHBORS
             if (p[0]+dx, p[1]+dy) in channels
             and cells[p] != cells[(p[0]+dx, p[1]+dy)]}
    culverts = set()
    for item in spec.get('culverts', []):
        assert isinstance(item, list) and len(item) == 2, (tile['id'], 'invalid culvert')
        a, b = tuple(item[0]), tuple(item[1])
        edge = pair(a, b)
        assert edge in walls and edge not in culverts, (tile['id'], 'invalid culvert edge')
        culverts.add(edge)
    # Cell-adjacent stone partitions separate water pockets as well as walking routes.
    partitions = {pair(tuple(a), tuple(b))
                  for a, b in tile.get('terrain', {}).get('barriers', [])}
    gate_edges = set(edges)
    assert not partitions & (gate_edges | culverts), (tile['id'], 'partition overlaps gate or culvert')
    walls |= {e for e in partitions if e[0] in channels and e[1] in channels}
    # With every shutter opened, the intake must lead to the receiving sump.
    assert outlet in connected(channels, walls-culverts, inlet), (tile['id'], 'disconnected race')
    isolated = spec.get('isolated_shutters', False)
    assert type(isolated) is bool, (tile['id'], 'bad isolated-shutter flag')
    if isolated:
        assert len(gates) >= 2, (tile['id'], 'insufficient shutter branches')
        shut_edges = {pair(tuple(g['a']), tuple(g['b'])) for g in gates.values()}
        upstream = connected(channels, (walls-culverts) | shut_edges, inlet)
        claimed = set()
        for gate_id in gates:
            blocked = (walls-culverts) | {
                pair(tuple(g['a']), tuple(g['b']))
                for k, g in gates.items() if k != gate_id
            }
            freshly_reached = connected(channels, blocked, inlet) - upstream
            assert freshly_reached and not (freshly_reached & claimed), (tile['id'], 'not independent shutter pockets')
            claimed |= freshly_reached
    # Independent check of the *assumed* lower level. An ordered route gives
    # flow direction toward an internal, explicitly unfinished terminus.
    # Drain pickups descend one-way: they do not join upper sluice pockets.
    lower = spec.get('tailrace')
    lower_cells = lower_pickups = 0
    if lower is not None:
        assert isinstance(lower, dict) and type(lower.get('level')) is int and lower['level'] == -1, (tile['id'], 'invalid lower level')
        assert lower.get('hydraulic_separation') == 'vented_free_fall', (tile['id'], 'lower drain may backflow without a vented free-fall air break')
        raw = lower.get('cells')
        assert isinstance(raw, list) and len(raw) >= 3, (tile['id'], 'short lower collector')
        route = []
        seam = lower.get('boundary_edge')
        seam_at = lower_edge_point(seam) if seam is not None else None
        for index, p in enumerate(raw):
            assert (isinstance(p, list) and len(p) == 2 and all(type(v) is int for v in p)), (tile['id'], 'bad lower coordinate')
            q = tuple(p)
            assert (q == seam_at if seam_at is not None and index == len(raw)-1
                    else all(0 < v < 19 for v in q)), (tile['id'], 'lower path cannot leak through unmodeled boundary')
            route.append(q)
        assert len(route) == len(set(route)), (tile['id'], 'branching/looping lower race')
        assert all(abs(a[0]-b[0])+abs(a[1]-b[1]) == 1 for a, b in zip(route, route[1:])), (tile['id'], 'disconnected lower collector')
        assert isinstance(lower.get('terminus'), list) and tuple(lower['terminus']) == route[-1], (tile['id'], 'unmapped outlet position')
        validate_lower_grade(route, lower.get('grade'), vented=True)
        raw_drops = lower.get('pickups')
        assert isinstance(raw_drops, list) and raw_drops, (tile['id'], 'no lower drain pickups')
        assert all(isinstance(p, list) and len(p) == 2 and all(type(v) is int for v in p) for p in raw_drops), (tile['id'], 'bad drain point')
        pickups = {tuple(p) for p in raw_drops}
        assert len(pickups) == len(raw_drops), (tile['id'], 'repeated lower shaft')
        headwater = connected(channels, (walls-culverts) | edges, inlet)
        assert (pickups <= (channels & set(route)) and not pickups & water
                and not pickups & headwater and route[-1] not in pickups), (tile['id'], 'bypassing sealed headrace')
        if isolated:
            checked = set()
            for gate_id in gates:
                blocked = (walls-culverts) | {pair(tuple(g['a']), tuple(g['b']))
                    for k, g in gates.items() if k != gate_id}
                pocket = connected(channels, blocked, inlet) - headwater
                match = pickups & pocket
                assert len(match) == 1, (tile['id'], 'gate lacks unique lower drain')
                checked |= match
            assert checked == pickups, (tile['id'], 'pickup outside a shutter pocket')
        lower_cells, lower_pickups = len(route), len(pickups)
    assigned, locations, control_ids = set(), set(), set()
    for station in spec.get('controls', []):
        at = tuple(station['at'])
        assert (station.get('kind') == 'handwheel'
                and station.get('gate') in gates and station['gate'] not in assigned
                and station['id'] not in control_ids and at in cells and cells[at] == 'hall'
                and at not in water and at not in locations and at not in PORTALS), (tile['id'], 'invalid gate station')
        assigned.add(station['gate'])
        locations.add(at)
        control_ids.add(station['id'])
    if 'controls' in spec:
        assert assigned == set(gates), (tile['id'], 'uncontrolled shutter')
    # Independent check of each authored stage, including partial sluice-bank openings.
    state = {k: gate['default'] for k, gate in gates.items()}
    submerged = set(water)
    previous_level = float('-inf')
    stage_ids = set()
    for stage in spec.get('stages', []):
        assert isinstance(stage, dict) and isinstance(stage.get('id'), str), (tile['id'], 'invalid stage')
        assert stage['id'] not in stage_ids and stage['id'] != 'normal', (tile['id'], 'duplicate stage')
        stage_ids.add(stage['id'])
        changes = stage.get('gate_states', {})
        assert isinstance(changes, dict) and all(
            k in state and v in ('closed', 'open') for k, v in changes.items()), (tile['id'], 'invalid stage gate state')
        state.update(changes)
        surface = stage.get('surface_level', previous_level)
        assert isinstance(surface, (int, float)) and surface >= previous_level and surface >= 0, (tile['id'], 'falling waterline')
        previous_level = surface
        added_list = [tuple(p) for p in stage.get('add_water', [])]
        additions = set(added_list)
        assert (additions and len(additions) == len(added_list) and additions <= channels
                and not additions & submerged), (tile['id'], 'invalid stage inundation')
        closed_edges = {pair(tuple(g['a']), tuple(g['b']))
                        for k, g in gates.items() if state[k] == 'closed'}
        seen = connected(submerged | additions, (walls - culverts) | closed_edges, inlet)
        assert additions <= seen, (tile['id'], 'flood bypassed a closed shutter or partition')
        submerged |= additions
    return {'engineered_channel_cells': len(channels), 'sluice_controls': len(locations),
            'hydraulic_partitions': len(partitions & walls), 'flood_stages': len(stage_ids),
            'lower_tailrace_cells': lower_cells, 'lower_tailrace_pickups': lower_pickups,
            'lower_relay_cells': lower_relay_cells, **foundation_report}

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
        assert room in chambers and kind in ('door','secret','locked','opening')
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
    maintenance_report = check_maintenance(tile, cells)
    return {'id':name,'rooms':len(chambers),'doors':len(doors),'corridor_cycles':loops,'floor_cells':len(cells),**terrain_report,**vertical_report,**waterworks_report,**maintenance_report}

def main():
    data=json.loads(Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).with_name('blueprints.json')).read_text())
    assert {rotate(p,r) for p in PORTALS for r in range(4)}==PORTALS,'portals are not rotation-invariant'
    reports=[validate(t) for t in data['tiles']]
    for r in reports:print(f"PASS {r['id']}: {r['rooms']} chambers, {r['doors']} doors, {r['corridor_cycles']} hall loops")
    print(f"PASS {len(reports)} geomorphs; exact edge mask survives all quarter-turns")

if __name__=='__main__':main()

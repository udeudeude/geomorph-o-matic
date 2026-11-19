"""Independent checks of assumed sluice drives and inspectable underfloor bends.

A sealed cleanout is not a walkable dungeon connector. These tests validate
topological constructability only, not structural capacity or real headroom.
"""
def coords(p):
    assert isinstance(p, list) and len(p) == 2 and all(type(v) is int and 0 < v < 19 for v in p), 'bad service coordinate'
    return tuple(p)


def route(raw, label):
    assert isinstance(raw, list) and raw, (label, 'empty route')
    points = [coords(p) for p in raw]
    assert len(set(points)) == len(points), (label, 'repeated station')
    assert all(abs(a[0]-b[0])+abs(a[1]-b[1]) == 1 for a,b in zip(points, points[1:])), (label, 'broken route')
    return points


def turns(points):
    return {points[i] for i in range(1, len(points)-1)
            if (points[i][0]-points[i-1][0], points[i][1]-points[i-1][1]) !=
               (points[i+1][0]-points[i][0], points[i+1][1]-points[i][1])}


def check_maintenance(tile, cells):
    hyd=tile.get('hydrology', {})
    controls={c['id']:c for c in hyd.get('controls', [])}
    gates={g['id']:g for g in hyd.get('gates', [])}
    paths=hyd.get('transmissions', [])
    if 'transmissions' in hyd:
        assert len(paths)==len(gates)==len(controls), 'one shaft per independently operated shutter'
    used=set()
    drive_gates=set()
    gearboxes_count=0
    for m in paths:
        assert m.get('kind')=='ceiling_shaft_rack' and m['control'] in controls and m['gate'] in gates, 'mechanical drive kind/identifiers'
        assert controls[m['control']]['gate']==m['gate'] and m['gate'] not in drive_gates, 'misassigned gate shaft'
        assert 7 <= m['shaft_axis_ft'] <= 12 and 0 < m['shaft_diameter_in'] <= 3, 'unbounded tentative drive dimensions'
        p=route(m['path'], 'mechanical drive')
        assert p[0]==coords(controls[m['control']]['at']) and p[-1]==coords(gates[m['gate']]['b']), 'disconnected drive endpoints'
        assert not used.intersection(p), 'overlapping overhead mechanisms'
        used.update(p)
        borings={coords(q) for q in m['bored_at']}
        assert len(borings)==len(m['bored_at']) and borings=={q for q in p if q not in cells}, 'undocumented rock piercing'
        bearings={coords(q) for q in m['bearings']}
        assert len(bearings)==len(m['bearings']) and len(bearings)>=2 and bearings<=set(p[1:-1]), 'unanchored drive'
        bends=turns(p)
        boxes=m.get('gearboxes')
        assert isinstance(boxes,list) and len(boxes)==len(bends), 'geared drive must house every right-angle turn'
        boxed=set()
        controls_at={tuple(c['at']):c['id'] for c in controls.values()}
        wet={tuple(p) for p in tile.get('terrain',{}).get('water',[])}
        for box in boxes:
            assert box.get('kind')=='recessed_bevel_gearbox' and box.get('access')=='sealed_overhead_service_panel', 'unknown gearbox assembly'
            width=box.get('housing_width_ft')
            assert type(width) in (int,float) and 0.75 <= width <= 2, 'unbounded gearbox width'
            assert type(box.get('shutdown_required')) is bool, 'missing service lockout state'
            station=coords(box['at'])
            landing=coords(box['service_from'])
            assert station in bends and station not in boxed, 'misplaced or duplicated bevel gearbox'
            assert abs(station[0]-landing[0])+abs(station[1]-landing[1])==1, 'service panel cannot reach gearbox'
            assert cells.get(station) in (None,'hall') and cells.get(landing)=='hall' and landing not in wet, 'service panel has no dry hallway face'
            occupied=controls_at.get(landing)
            assert (occupied==m['control'] and box['shutdown_required']) if occupied else not box['shutdown_required'], 'gearbox servicing conflicts with control'
            boxed.add(station)
            gearboxes_count+=1
        drive_gates.add(m['gate'])
    lower=hyd.get('tailrace') or hyd.get('subfloor_relay')
    if not lower:
        return {'maintenance_drives':len(paths),'gearboxes':gearboxes_count,'inspection_covers':0,'service_spurs_ft':0}
    main=[tuple(p) for p in lower['cells']]
    bends=turns(main)
    inspections=lower.get('inspections')
    assert isinstance(inspections,list) and len(inspections)==len(bends), 'every lower turn requires explicit inspection'
    cover_positions=set()
    visited_bends=set()
    wet={tuple(p) for p in tile.get('terrain',{}).get('water',[])}
    controls_at={tuple(c['at']) for c in controls.values()}
    footage=0
    for item in inspections:
        assert item.get('kind')=='bolted_cleanout_riser' and 0 < item.get('nominal_clear_diameter_ft',0) <= 2, 'invalid cleanout diameter'
        bend,cover=coords(item['at']),coords(item['surface'])
        assert bend in bends and bend not in visited_bends, 'inspection at wrong bend'
        assert cover not in cover_positions and cover not in wet and cover not in controls_at and cells.get(cover)=='hall', 'hatch not accessible in dry corridor'
        spur=route(item['branch'], 'lateral inspection spur')
        assert len(spur)<=5 and spur[0]==bend and spur[-1]==cover, 'unattached cleanout branch'
        assert not (set(spur[1:]) & set(main)), 'cleanout side connection breaks collector'
        assert all(cells.get(p) in (None,'hall') for p in spur[1:]), 'cleanout cuts chamber footings'
        footage+=(len(spur)-1)*2.5
        visited_bends.add(bend)
        cover_positions.add(cover)
    return {'maintenance_drives':len(paths),'gearboxes':gearboxes_count,'inspection_covers':len(inspections),'service_spurs_ft':footage}

"""Independent geometric screen for the specialist receiving-ravine study.

This does NOT calculate discharge, erosion resistance or safe access.
"""
def verify_receiver(data, annex):
    assert annex["schema_version"] == 1
    assert annex["kind"] == "specialist_exterior_receiving_reach"
    assert annex["status"] == "conceptual_reach_downstream_river_unmapped"
    p = next(t for t in data["tiles"] if t["id"] == "postern_bastion")
    o = p["hydrology"]["subfloor_relay"]["outfall"]
    assert o["exit_edge"] == {"kind": "subfloor_outfall", "side": "E", "offset": 9}
    assert annex["entry_edge"] == {"kind": "subfloor_outfall", "side": "W", "offset": 9}
    assert annex["exit_edge"] == {"kind": "open_watercourse", "side": "E", "offset": 9}
    route, elevations = annex["stations"], annex["bed_ft"]
    assert len(route) == len(elevations) == 20
    assert route[0] == [0, 9] and route[-1] == [19, 9]
    assert len({tuple(p) for p in route}) == len(route)
    assert all(type(x) is int and 0 <= x <= 19 for p in route for x in p)
    for i in range(1, len(route)):
        assert sum(abs(a-b) for a,b in zip(route[i-1], route[i])) == 1
        dz = elevations[i-1]-elevations[i]
        assert 0 < dz <= .25 + 1e-8
    lip_z = p["hydrology"]["subfloor_relay"]["grade"]["inverts_ft"][-1]
    assert 0 < lip_z-elevations[0] <= .25
    reaches = annex["reaches"]
    assert [r["id"] for r in reaches] == [
        "masonry_throat", "stone_apron", "desilting_pocket", "rocky_receiving_bed"
    ]
    assert reaches[0]["first"] == 0 and reaches[-1]["last"] == 19
    assert all(a["last"]+1 == b["first"] for a,b in zip(reaches, reaches[1:]))
    assert all(r["first"] <= r["last"] and 2 <= r["clear_width_ft"] <= 7.5 for r in reaches)
    assert all(a["clear_width_ft"] <= b["clear_width_ft"] for a,b in zip(reaches, reaches[1:]))
    assert reaches[0]["clear_width_ft"] == o["nominal_clear_width_ft"]
    pocket = annex["desilting_pocket"]
    assert pocket["at"] == [10,9] and pocket["extra_depth_ft"] == 1
    trail = annex["upper_terrace"]["path"]
    assert trail[0] == [14,0] and trail[-1] == pocket["service_landing"] == [10,7]
    assert len({tuple(p) for p in trail}) == len(trail)
    assert not ({tuple(p) for p in trail} & {tuple(p) for p in route})
    assert all(sum(abs(a-b) for a,b in zip(x,y)) == 1 for x,y in zip(trail,trail[1:]))
    terrace = annex["upper_terrace"]
    assert [12,5] in trail
    for label,start,end in (
        ("bridge_access",[12,5],[12,7]),
        ("south_footpath",[12,11],[12,19]),
    ):
        b=terrace[label]
        assert b[0] == start and b[-1] == end
        assert len({tuple(p) for p in b}) == len(b)
        assert all(sum(abs(a-c) for a,c in zip(x,y)) == 1 for x,y in zip(b,b[1:]))
        assert not ({tuple(p) for p in b[1:]} & {tuple(p) for p in route})
    assert pocket["inspection_steps"] == [[10,7],[10,8]]
    assert tuple(pocket["inspection_steps"][-1]) not in {tuple(p) for p in route}
    bridge = annex["upper_terrace"]["bridge"]
    levels = annex["receiving_levels_ft"]
    assert bridge["at_x"] == 12 and bridge["from_y"] == 7 and bridge["to_y"] == 11
    assert bridge["deck_ft"] > levels["high"]
    assert annex["bank_top_ft"] > levels["high"] > levels["ordinary"]
    assert levels == o["water_levels_ft"]
    return {"mapped_stations": len(route), "unverified_downstream": True}

"""Independent floor-coordinate and restricted-headroom route checks."""
import json
import unittest
from pathlib import Path
from test_sheetflow_cave import occupancy, entrances, navigate, edge

ROOT=Path(__file__).resolve().parents[1]
TILES=json.loads((ROOT/"wide-blueprints.json").read_text())["tiles"]
OFFSETS={4,5,14,15}
PORTALS={(x,y) for x in OFFSETS for y in (0,19)} | {(x,y) for x in (0,19) for y in OFFSETS}
EXPECTED={
    "braided_lava":(187,185,185,23,31),
    "sagging_sheet":(238,236,238,29,31),
    "split_spine":(223,208,208,None,None),
}

def route(tile,minimum_feet):
    occupied=occupancy(tile)
    thresholds=entrances(tile,occupied)
    scenario=tile["roof_scenario"]
    cut=set()
    for zone in scenario["zones"]:
        if zone["clearance_feet"]<minimum_feet:
            cut.update(tuple(p) for p in zone["cells"])
    included={p:v for p,v in occupied.items() if p not in cut}
    blocked={edge(tuple(a),tuple(b)) for a,b in tile["terrain"].get("chokes",[])}
    raised={tuple(p) for level,cells in tile["terrain"].get("elevations",[]) for p in cells}
    ramps={edge(tuple(a),tuple(b)) for a,b in tile["terrain"].get("ramps",[])}
    walk=lambda start:navigate(included,thresholds,start,blocked,raised,ramps)
    return included,walk

class WideHeadroomIndependentTests(unittest.TestCase):
    def test_registered_zones_have_real_occupied_interior_floor(self):
        for tile in TILES:
            floor=occupancy(tile)
            scenario=tile["roof_scenario"]
            self.assertEqual(scenario["status"],"hypothetical")
            self.assertEqual(scenario["baseline_feet"],{"braided_lava":8,"sagging_sheet":6.5,"split_spine":7.5}[tile["id"]])
            for zone in scenario["zones"]:
                self.assertEqual(len(zone["cells"]),2)
                for pair in zone["cells"]:
                    p=tuple(pair)
                    self.assertIn(p,floor)
                    self.assertNotIn(p,PORTALS)
                    self.assertTrue(1<p[0]<18 and 1<p[1]<18)
    def test_three_distinct_posture_scenarios_preserve_all_wide_mouths(self):
        for tile in TILES:
            floor_count,standing_count,crouching_count,_,_=EXPECTED[tile["id"]]
            self.assertEqual(len(occupancy(tile)),floor_count)
            for threshold,required in ((6,standing_count),(4,crouching_count),(2.5,floor_count)):
                admitted,walk=route(tile,threshold)
                excluded=sum(len(z["cells"]) for z in tile["roof_scenario"]["zones"] if z["clearance_feet"]<threshold)
                self.assertEqual(len(admitted),floor_count-excluded,(tile["id"],threshold))
                visited=walk((4,0))
                self.assertEqual(len(visited),required,(tile["id"],threshold))
                for p in PORTALS:self.assertIn(p,visited,(tile["id"],threshold,p))
    def test_sagged_roofs_force_real_alternate_dry_walks(self):
        for tile in TILES:
            floor_count,standing_count,crouching_count,normal,restricted=EXPECTED[tile["id"]]
            if normal is None:continue
            _,crawling=route(tile,2.5)
            _,standing=route(tile,6)
            self.assertEqual(crawling((0,4))[(19,4)],normal)
            self.assertEqual(standing((0,4))[(19,4)],restricted)
            self.assertGreater(restricted,normal)
    def test_lower_squeeze_requires_crawl_without_excluding_an_outside_entrance(self):
        spine=next(tile for tile in TILES if tile["id"]=="split_spine")
        _,standing=route(spine,6)
        _,crawling=route(spine,2.5)
        self.assertNotIn((6,9),standing((4,0)))
        self.assertIn((6,9),crawling((4,0)))
        self.assertEqual(len(standing((4,0))),208)
        self.assertEqual(len(crawling((4,0))),223)

if __name__=="__main__":
    unittest.main()

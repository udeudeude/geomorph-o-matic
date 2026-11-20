"""Independent Python roof-height propagation checks from raw authored floors.

These are invented design clearances above local floors, not cave measurements.
"""
import json
import unittest
from collections import deque
from pathlib import Path
from test_sheetflow_cave import occupancy

DATA=json.loads((Path(__file__).resolve().parents[1]/"wide-blueprints.json").read_text())
OFFSETS=(4,5,14,15)
MOUTHS={(o,depth) for o in OFFSETS for depth in (0,1,18,19)}
MOUTHS|={(depth,o) for o in OFFSETS for depth in (0,1,18,19)}
STEPS=((1,0),(-1,0),(0,1),(0,-1))

def independently_propagate(tile):
    floor=set(occupancy(tile))
    scenario=tile["roof_scenario"]
    assert MOUTHS<=floor, (tile["id"], MOUTHS-floor)
    assert scenario["throat_transition_feet_per_half_cell"]==.5
    queue=deque(sorted(MOUTHS))
    distance={p:0 for p in MOUTHS}
    while queue:
        p=queue.popleft()
        for dx,dy in STEPS:
            q=(p[0]+dx,p[1]+dy)
            if q in floor and q not in distance:
                distance[q]=distance[p]+1
                queue.append(q)
    assert set(distance)==floor, (tile["id"],len(floor)-len(distance))
    result={p:min(scenario["baseline_feet"],6.5+distance[p]*.5) for p in floor}
    low={}
    for zone in scenario["zones"]:
        for x,y in zone["cells"]:
            low[(x,y)]=zone["clearance_feet"]
    result.update(low)
    return result,distance,low

class WideRoofTransitionIndependentTests(unittest.TestCase):
    def test_crowns_preserve_all_64_per_tile_throat_cells_and_real_occupied_floor(self):
        for tile in DATA["tiles"]:
            heights,dist,low=independently_propagate(tile)
            self.assertEqual(len(MOUTHS),64)
            self.assertEqual(set(heights),set(occupancy(tile)))
            for mouth in MOUTHS:
                self.assertEqual(dist[mouth],0)
                self.assertEqual(heights[mouth],6.5)
                self.assertNotIn(mouth,low)
    def test_crown_band_height_changes_are_gradual_except_authored_sag_or_squeeze(self):
        for tile in DATA["tiles"]:
            heights,dist,low=independently_propagate(tile)
            for x,y in heights:
                for dx,dy in ((1,0),(0,1)):
                    p=(x,y);q=(x+dx,y+dy)
                    if q not in heights or p in low or q in low:
                        continue
                    self.assertLessEqual(abs(heights[p]-heights[q]),.5,(tile["id"],p,q))
            self.assertEqual(set(low),{tuple(p) for z in tile["roof_scenario"]["zones"] for p in z["cells"]})
    def test_distinct_cave_vaults_have_meaningful_transition_bands(self):
        expected={"braided_lava":{7,7.5},"sagging_sheet":set(),"split_spine":{7}}
        for tile in DATA["tiles"]:
            heights,dist,low=independently_propagate(tile)
            inside={h for p,h in heights.items() if p not in low and h<tile["roof_scenario"]["baseline_feet"] and dist[p]>0}
            self.assertEqual(inside,expected[tile["id"]])
            self.assertGreater(max(dist.values()),2)
            for p in low:self.assertEqual(heights[p],tile["roof_scenario"]["zones"][0]["clearance_feet"])
    def test_existing_low_roof_constrictions_remain_below_standing_threshold(self):
        for tile in DATA["tiles"]:
            heights,_,low=independently_propagate(tile)
            self.assertEqual(len(low),2)
            for p in low:
                self.assertLess(heights[p],6)
            for p in MOUTHS:
                self.assertGreaterEqual(heights[p],6)

if __name__=="__main__":
    unittest.main()

"""Independent registered absolute-vault checks from the source floor plan.

This does not import the JavaScript renderer or use its modeled roof results.
Heights are fictional elevation design geometry, not geological measurements.
"""
import json
import unittest
from collections import deque
from pathlib import Path
from test_sheetflow_cave import occupancy

ROOT=Path(__file__).resolve().parents[1]
TILES={t["id"]:t for t in json.loads((ROOT/"wide-blueprints.json").read_text())["tiles"]}
SIDES=((1,0),(-1,0),(0,1),(0,-1))
MOUTHS={(o,d) for o in (4,5,14,15) for d in (0,1,18,19)}
MOUTHS|={(d,o) for o in (4,5,14,15) for d in (0,1,18,19)}

def independent_roof(tile):
    floor=set(occupancy(tile))
    s=tile["roof_scenario"]
    depth=dict.fromkeys(MOUTHS,0)
    queue=deque(sorted(MOUTHS))
    while queue:
        x,y=queue.popleft()
        for dx,dy in SIDES:
            q=(x+dx,y+dy)
            if q in floor and q not in depth:
                depth[q]=depth[(x,y)]+1
                queue.append(q)
    assert set(depth)==floor
    ceiling={p:min(s["baseline_feet"],6.5+.5*depth[p]) for p in floor}
    low=set()
    for z in s["zones"]:
        for p in z["cells"]:
            p=tuple(p)
            low.add(p)
            ceiling[p]=z["clearance_feet"]
    authored=set()
    for z in s["absolute_vault"]["zones"]:
        for p in z["cells"]:
            p=tuple(p)
            assert p in floor and p not in low and p not in authored and p not in MOUTHS
            authored.add(p)
            ceiling[p]=z["roof_elevation_feet"]
    return floor,ceiling,low,authored

class IndependentlyReconstructedVaults(unittest.TestCase):
    def test_real_nonuniform_roof_is_continuous_on_occupied_plan(self):
        for name in ("braided_lava","split_spine"):
            tile=TILES[name]
            floor,roof,low,authored=independent_roof(tile)
            self.assertEqual(len(authored),16 if name=="braided_lava" else 17)
            self.assertEqual(set(roof),floor)
            self.assertTrue(all(roof[p]>=6 for p in floor-low))
            self.assertEqual({roof[p] for p in authored},{8.5,9} if name=="braided_lava" else {8,8.5})
            for x,y in floor-low:
                for q in ((x+1,y),(x,y+1)):
                    if q in floor and q not in low:
                        self.assertLessEqual(abs(roof[(x,y)]-roof[q]),.5,(name,(x,y),q))
            for p in MOUTHS:self.assertEqual(roof[p],6.5)
    def test_roofs_still_keep_real_low_ceiling_and_topological_openings(self):
        for name in ("braided_lava","split_spine"):
            tile=TILES[name]
            floor,roof,low,authored=independent_roof(tile)
            self.assertEqual(len(low),2)
            self.assertTrue(all(roof[p]==3.5 for p in low))
            self.assertTrue(all(p not in authored for p in low))
            self.assertTrue(MOUTHS<=floor)
            self.assertEqual(len(tile["terrain"]["chokes"]),2 if name=="braided_lava" else 3)

if __name__=="__main__":
    unittest.main()

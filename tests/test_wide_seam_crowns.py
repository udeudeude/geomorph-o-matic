"""Independent plan-registered wide-mouth shared-crown verification, without JavaScript imports.

These dimensions are hypothetical cave-design contracts, not geological survey grades.
"""
import json
import unittest
from pathlib import Path
from validate import rotate
from test_sheetflow_cave import occupancy

ROOT=Path(__file__).resolve().parents[1]
TILES={t["id"]:t for t in json.loads((ROOT/"wide-blueprints.json").read_text())["tiles"]}
LAYOUT=json.loads((ROOT/"studies/assembly_three_wide_2x2.json").read_text())
OFFSETS=(4,5,14,15)
DEPTHS=(0,1)

def world(layout):
    floors={}
    crowns={}
    for ty,row in enumerate(layout["rows"]):
        for tx,placement in enumerate(row):
            tile=TILES[placement["id"]]
            scenario=tile["roof_scenario"]
            inside=occupancy(tile)
            raised={tuple(p) for _,coords in tile.get("terrain",{}).get("elevations",[]) for p in coords}
            mouth={(n,depth) for n in OFFSETS for depth in DEPTHS}
            mouth|={(n,19-depth) for n in OFFSETS for depth in DEPTHS}
            mouth|={(depth,n) for n in OFFSETS for depth in DEPTHS}
            mouth|={(19-depth,n) for n in OFFSETS for depth in DEPTHS}
            for point in inside:
                local=rotate(point,placement["turn"])
                target=(tx*20+local[0],ty*20+local[1])
                assert target not in floors
                floors[target]=1 if point in raised else 0
                crowns[target]=scenario["mouth_crown_feet"] if point in mouth else scenario["baseline_feet"]
                for zone in scenario["zones"]:
                    if list(point) in zone["cells"]:
                        crowns[target]=zone["clearance_feet"]
    return floors,crowns

class IndependentCrownContractTests(unittest.TestCase):
    def test_all_rotated_seams_have_eight_equal_floor_and_crown_samples(self):
        floors,crowns=world(LAYOUT)
        self.assertEqual(len(floors),869)
        samples=[]
        for sy in range(2):
            for n in OFFSETS:
                for depth in DEPTHS:
                    a=(19-depth,sy*20+n);b=(20+depth,sy*20+n)
                    samples.append((a,b))
        for sx in range(2):
            for n in OFFSETS:
                for depth in DEPTHS:
                    a=(sx*20+n,19-depth);b=(sx*20+n,20+depth)
                    samples.append((a,b))
        self.assertEqual(len(samples),32)
        for a,b in samples:
            self.assertEqual((floors[a],floors[b]),(0,0))
            self.assertEqual((crowns[a],crowns[b]),(6.5,6.5))
    def test_every_external_entrance_has_two_rows_of_consistent_six_and_half_foot_clearance(self):
        floors,crowns=world(LAYOUT)
        checked=set()
        for tx in range(2):
            for n in OFFSETS:
                for d in DEPTHS:
                    checked.add((20*tx+n,d))
                    checked.add((20*tx+n,39-d))
        for ty in range(2):
            for n in OFFSETS:
                for d in DEPTHS:
                    checked.add((d,20*ty+n))
                    checked.add((39-d,20*ty+n))
        self.assertEqual(len(checked),64)
        self.assertEqual({(floors[p],crowns[p]) for p in checked},{(0,6.5)})

if __name__=="__main__":
    unittest.main()

"""Independent cell-by-cell topology verification of the unreleased split-spine volcanic cave."""
import json
import unittest
from pathlib import Path
from validate import rotate
from test_sheetflow_cave import occupancy, entrances, navigate, edge

ROOT=Path(__file__).resolve().parents[1]
CAVE=next(t for t in json.loads((ROOT/"wide-blueprints.json").read_text())["tiles"] if t["id"]=="split_spine")
OFFSETS={4,5,14,15}
BOUNDARY={(x,y) for x in OFFSETS for y in (0,19)} | {(x,y) for x in (0,19) for y in OFFSETS}
class SplitSpineCaveTests(unittest.TestCase):
    def setUp(self):
        self.floor=occupancy(CAVE)
        self.doors=entrances(CAVE,self.floor)
        self.closed={edge(tuple(a),tuple(b)) for a,b in CAVE["terrain"]["chokes"]}
    def traverse(self,closed=None,start=(0,4)):
        return navigate(self.floor,self.doors,start,self.closed if closed is None else closed,set(),set())
    def test_actual_occupied_floor_and_throats_rotated_four_ways(self):
        self.assertEqual(len(CAVE["rooms"]),4)
        self.assertEqual(len(CAVE["doors"]),8)
        self.assertEqual(len(self.floor),223)
        for turn in range(4):
            occupied={rotate(p,turn) for p in self.floor}
            self.assertEqual({p for p in occupied if p[0] in (0,19) or p[1] in (0,19)},BOUNDARY)
            for side in "NSEW":
                for o in OFFSETS:
                    for depth in (0,1):
                        p={"N":(o,depth),"S":(o,19-depth),"W":(depth,o),"E":(19-depth,o)}[side]
                        self.assertIn(p,occupied)
    def test_central_bedrock_is_real_and_both_distributary_lanes_exist(self):
        for p in ((8,8),(9,9),(10,10),(11,11)):self.assertNotIn(p,self.floor)
        self.assertIn((7,10),self.floor)
        self.assertIn((12,10),self.floor)
        for e in self.closed:
            a,b=tuple(e)
            self.assertEqual(self.floor[a],self.floor[b],"hall")
            self.assertEqual(abs(a[0]-b[0])+abs(a[1]-b[1]),1)
        self.assertEqual(len(self.closed),3)
    def test_three_collapse_edges_change_shortest_real_route_not_connectivity(self):
        open_routes=self.traverse(closed=set())
        blocked_routes=self.traverse()
        self.assertEqual(open_routes[(0,14)],22)
        self.assertEqual(blocked_routes[(0,14)],34)
        self.assertEqual(len(self.traverse(start=(4,0))),223)
        for p in BOUNDARY:self.assertIn(p,self.traverse(start=(4,0)))
        for e in self.closed:
            a,b=tuple(e)
            self.assertEqual(a[1],7)
            self.assertEqual(b[1],8)
    def test_structurally_walled_chamber_cannot_be_reached_without_its_opening(self):
        altered={e for e in self.doors}
        west={e for e in altered if any(self.floor[p]=="west_sump" for p in e)}
        self.assertEqual(len(west),1)
        distances=navigate(self.floor,altered-west,(4,0),self.closed,set(),set())
        self.assertLess(len(distances),223)
        self.assertFalse(any(self.floor[p]=="west_sump" for p in distances))
if __name__=="__main__":unittest.main()

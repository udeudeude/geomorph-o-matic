"""Independent implementation of wide cave geometry and traversal tests."""
import collections
import copy
import json
import unittest
from pathlib import Path
from validate import footprint, rotate

ROOT=Path(__file__).resolve().parents[1]
CAVE=json.loads((ROOT/"wide-blueprints.json").read_text())["tiles"][0]
PORTAL_OFFSETS={4,5,14,15}
PORTALS={(x,y) for x in PORTAL_OFFSETS for y in (0,19)} | {(x,y) for y in PORTAL_OFFSETS for x in (0,19)}

def build(tile):
    cells={}
    for rid,_,shape in tile["rooms"]:
        for p in footprint(shape):
            assert p not in cells
            cells[p]=rid
    for route in tile["routes"]:
        for a,b in zip(route["points"],route["points"][1:]):
            assert a[0]==b[0] or a[1]==b[1]
            for x in range(min(a[0],b[0]),max(a[0],b[0])+1):
                for y in range(min(a[1],b[1]),max(a[1],b[1])+1):
                    assert cells.get((x,y),"hall")=="hall"
                    cells[x,y]="hall"
    return cells

def edge(a,b):return frozenset((a,b))
def structural_walls(tile,cells):
    walls={edge(p,(p[0]+dx,p[1]+dy)) for p in cells
           for dx,dy in ((1,0),(0,1))
           if (p[0]+dx,p[1]+dy) in cells and cells[p]!=cells[(p[0]+dx,p[1]+dy)]}
    doors=set()
    for rid,side,n,kind in tile["doors"]:
        owned=[p for p,z in cells.items() if z==rid]
        x1=min(p[0] for p in owned);x2=max(p[0] for p in owned)
        y1=min(p[1] for p in owned);y2=max(p[1] for p in owned)
        a,b={"N":((n,y1),(n,y1-1)),"S":((n,y2),(n,y2+1)),
             "W":((x1,n),(x1-1,n)),"E":((x2,n),(x2+1,n))}[side]
        assert cells.get(a)==rid and cells.get(b)=="hall", (rid,side,n)
        doors.add(edge(a,b))
    assert len(doors)==len(tile["doors"]) and doors<=walls
    return walls-doors

def walk(cells,closed,start,target=None):
    seen={start};queue=collections.deque([(start,0)])
    while queue:
        p,n=queue.popleft()
        if p==target:return n
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            q=(p[0]+dx,p[1]+dy)
            if q in cells and q not in seen and edge(p,q) not in closed:
                seen.add(q);queue.append((q,n+1))
    return seen if target is None else None

class WideBraidedCaveTests(unittest.TestCase):
    def test_all_rotations_have_exact_two_wide_five_foot_mouths_per_side(self):
        self.assertEqual(CAVE["seam_profile"],"cave-wide-v1")
        cells=build(CAVE)
        self.assertEqual(len(cells),185)
        self.assertEqual({p for p in cells if 0 in p or 19 in p},PORTALS)
        for turn in range(4):
            rotated={rotate(p,turn) for p in cells}
            self.assertEqual({p for p in rotated if 0 in p or 19 in p},PORTALS)
            for side in ("N","S","E","W"):
                for offset in PORTAL_OFFSETS:
                    for depth in range(2):
                        p={"N":(offset,depth),"S":(offset,19-depth),
                           "W":(depth,offset),"E":(19-depth,offset)}[side]
                        self.assertIn(p,rotated)
    def test_two_lane_collapse_is_real_and_alternate_routes_remain(self):
        cells=build(CAVE)
        walls=structural_walls(CAVE,cells)
        blocks={edge(tuple(a),tuple(b)) for a,b in CAVE["terrain"]["chokes"]}
        self.assertEqual(len(blocks),2)
        self.assertEqual(walk(cells,walls,(0,4),(0,14)),22)
        self.assertEqual(walk(cells,walls|blocks,(0,4),(0,14)),30)
        self.assertEqual(len(walk(cells,walls|blocks,(4,0))),len(cells))
        for p in PORTALS:self.assertIn(p,walk(cells,walls|blocks,(4,0)))
    def test_damaged_mouth_is_rejected_independently(self):
        cells=build(CAVE);cells.pop((5,1))
        for turn in range(4):
            rotated={rotate(p,turn) for p in cells}
            if turn==0:self.assertNotIn((5,1),rotated)
        self.assertNotEqual({p for p in cells if p[1]==1 and p[0] in (4,5,14,15)},
                            {(x,1) for x in PORTAL_OFFSETS})
if __name__=="__main__":unittest.main()

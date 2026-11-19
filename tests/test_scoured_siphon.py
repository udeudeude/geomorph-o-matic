"""Independent geometry and cave-terrain checks for the Scoured Siphon."""
import copy
import json
import unittest
from pathlib import Path
from validate import validate, validate_terrain, footprint

ROOT=Path(__file__).resolve().parents[1]
CAVE=next(t for t in json.loads((ROOT/"blueprints.json").read_text())["tiles"] if t["id"]=="scoured_siphon")

def floor(tile):
    occupied={}
    for name,_,shape in tile["rooms"]:
        for pos in footprint(shape):
            assert pos not in occupied
            occupied[pos]=name
    for route in tile["routes"]:
        for a,b in zip(route["points"],route["points"][1:]):
            for x in range(min(a[0],b[0]),max(a[0],b[0])+1):
                for y in range(min(a[1],b[1]),max(a[1],b[1])+1):
                    assert occupied.get((x,y),"hall")=="hall"
                    occupied[x,y]="hall"
    return occupied

class ScouredSiphonTests(unittest.TestCase):
    def test_full_geometry_and_morphology(self):
        r=validate(CAVE)
        self.assertEqual(r["rooms"],6)
        self.assertEqual(r["doors"],12)
        self.assertEqual(r["water_cells"],8)
        self.assertEqual(r["bridges"],1)
        self.assertEqual(r["ramps"],2)
        self.assertEqual(r["cave_choke_edges"],1)
        self.assertEqual(r["cave_detail_cells"],12)
    def test_flooded_bank_and_edge_constraints(self):
        t=copy.deepcopy(CAVE)
        t["terrain"]["bridges"]=[[10,8]]
        with self.assertRaises(AssertionError):validate_terrain(t,floor(t))
        t=copy.deepcopy(CAVE)
        t["terrain"]["elevations"][0][1].append([4,0])
        with self.assertRaises(AssertionError):validate_terrain(t,floor(t))
        t=copy.deepcopy(CAVE)
        t["terrain"]["chokes"]=[[[0,4],[1,4]]]
        with self.assertRaises(AssertionError):validate_terrain(t,floor(t))
    def test_collapse_does_not_disconnect_dry_portals(self):
        t=copy.deepcopy(CAVE)
        floor_cells=floor(t)
        water={tuple(p) for p in t["terrain"]["water"]}
        bridges={tuple(p) for p in t["terrain"]["bridges"]}
        high={tuple(p) for p in t["terrain"]["elevations"][0][1]}
        ramps={frozenset(map(tuple,p)) for p in t["terrain"]["ramps"]}
        chokes={frozenset(map(tuple,p)) for p in t["terrain"]["chokes"]}
        opened=set()
        for room,side,n,kind in t["doors"]:
            if kind=="secret":continue
            pts=[p for p,z in floor_cells.items() if z==room]
            xs=[p[0] for p in pts];ys=[p[1] for p in pts]
            lo_x,hi_x,lo_y,hi_y=min(xs),max(xs),min(ys),max(ys)
            if side=="N":a,b=(n,lo_y),(n,lo_y-1)
            elif side=="S":a,b=(n,hi_y),(n,hi_y+1)
            elif side=="W":a,b=(lo_x,n),(lo_x-1,n)
            else:a,b=(hi_x,n),(hi_x+1,n)
            opened.add(frozenset((a,b)))
        from collections import deque
        def path(start,end,closed):
            queue=deque([(start,0)]);seen=set()
            while queue:
                p,d=queue.popleft()
                if p==end:return d
                if p in seen:continue
                seen.add(p)
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    q=(p[0]+dx,p[1]+dy);e=frozenset((p,q))
                    if q not in floor_cells or e in closed:continue
                    if floor_cells[p]!=floor_cells[q] and e not in opened:continue
                    if p in water and p not in bridges or q in water and q not in bridges:continue
                    if (p in high)!=(q in high) and e not in ramps:continue
                    queue.append((q,d+1))
        assert path((0,4),(0,15),chokes)>path((0,4),(0,15),set())+8
        portals=((4,0),(15,0),(0,4),(19,4),(0,15),(19,15),(4,19),(15,19))
        self.assertTrue(all(path((4,0),p,chokes) is not None for p in portals))

if __name__=="__main__":unittest.main()

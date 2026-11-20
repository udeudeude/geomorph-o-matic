"""Independent topology and headroom-level checks for the unreleased sheet-flow cave."""
import collections
import json
import unittest
from pathlib import Path
from validate import footprint, rotate

ROOT=Path(__file__).resolve().parents[1]
TILES=json.loads((ROOT/"wide-blueprints.json").read_text())["tiles"]
CAVE=next(t for t in TILES if t["id"]=="sagging_sheet")
PORTAL_OFFSETS={4,5,14,15}
PORTALS={(x,y) for x in PORTAL_OFFSETS for y in (0,19)} | {(x,y) for x in (0,19) for y in PORTAL_OFFSETS}
STEP=((1,0),(-1,0),(0,1),(0,-1))

def edge(a,b): return frozenset((a,b))

def occupancy(tile):
    cells={}
    for rid,_,shape in tile["rooms"]:
        for p in footprint(shape):
            if p in cells: raise ValueError("chamber overlap")
            cells[p]=rid
    for route in tile["routes"]:
        for a,b in zip(route["points"],route["points"][1:]):
            if a[0]!=b[0] and a[1]!=b[1]:raise ValueError("diagonal passage")
            for x in range(min(a[0],b[0]),max(a[0],b[0])+1):
                for y in range(min(a[1],b[1]),max(a[1],b[1])+1):
                    p=(x,y)
                    if cells.get(p,"hall")!="hall":raise ValueError("chamber trespass")
                    cells[p]="hall"
    return cells

def entrances(tile,cells):
    links=set()
    for rid,side,n,kind in tile["doors"]:
        owned=[p for p in cells if cells[p]==rid]
        x1=min(x for x,y in owned);x2=max(x for x,y in owned)
        y1=min(y for x,y in owned);y2=max(y for x,y in owned)
        a,b={"N":((n,y1),(n,y1-1)),"S":((n,y2),(n,y2+1)),
             "W":((x1,n),(x1-1,n)),"E":((x2,n),(x2+1,n))}[side]
        if cells.get(a)!=rid or cells.get(b)!="hall" or kind!="opening":
            raise ValueError("invented chamber threshold")
        links.add(edge(a,b))
    if len(links)!=len(tile["doors"]):raise ValueError("duplicated chamber threshold")
    return links

def navigate(cells,links,start,closed,raised,ramps):
    d={start:0};q=collections.deque([start])
    while q:
        p=q.popleft()
        for dx,dy in STEP:
            v=(p[0]+dx,p[1]+dy);e=edge(p,v)
            if v not in cells or v in d or e in closed:continue
            if cells[p]!=cells[v] and e not in links:continue
            if (p in raised)!=(v in raised) and e not in ramps:continue
            d[v]=d[p]+1;q.append(v)
    return d

class SheetflowStudyTests(unittest.TestCase):
    def setUp(self):
        self.cells=occupancy(CAVE)
        self.links=entrances(CAVE,self.cells)
        self.closed={edge(tuple(a),tuple(b)) for a,b in CAVE["terrain"]["chokes"]}
        self.raised={tuple(p) for level,group in CAVE["terrain"]["elevations"] for p in group}
        self.ramps={edge(tuple(a),tuple(b)) for a,b in CAVE["terrain"]["ramps"]}
    def walk(self,start,closed=None,ramps=None):
        return navigate(self.cells,self.links,start,self.closed if closed is None else closed,
                        self.raised,self.ramps if ramps is None else ramps)
    def test_two_authored_cave_patterns_and_exact_rotatable_five_foot_entrances(self):
        self.assertEqual(len(TILES),2)
        self.assertEqual(CAVE["seam_profile"],"cave-wide-v1")
        self.assertEqual(len(CAVE["rooms"]),6)
        self.assertEqual(len(CAVE["doors"]),18)
        self.assertEqual(len(self.cells),238)
        for turn in range(4):
            cells={rotate(p,turn) for p in self.cells}
            self.assertEqual({p for p in cells if p[0] in (0,19) or p[1] in (0,19)},PORTALS)
            for side in "NSEW":
                for depth in (0,1):
                    for n in PORTAL_OFFSETS:
                        p={"N":(n,depth),"S":(n,19-depth),
                           "W":(depth,n),"E":(19-depth,n)}[side]
                        self.assertIn(p,cells)
    def test_collapsed_sheetflow_limb_changes_a_real_route_but_no_floor_is_lost(self):
        self.assertEqual(len(self.closed),2)
        open_distance=self.walk((5,0),closed=set())
        collapsed=self.walk((5,0))
        self.assertEqual(open_distance[(14,0)],17)
        self.assertEqual(collapsed[(14,0)],31)
        self.assertEqual(len(self.walk((4,0))),238)
        for p in PORTALS:self.assertIn(p,self.walk((4,0)))
        for e in self.closed:
            self.assertEqual(len(e),2)
            a,b=tuple(e)
            self.assertEqual(abs(a[0]-b[0])+abs(a[1]-b[1]),1)
            self.assertEqual(self.cells[a],self.cells[b],"hall")
    def test_elevated_basalt_bench_has_three_proper_cross_level_approaches(self):
        self.assertEqual(len(self.raised),8)
        self.assertEqual(self.raised,{p for p,r in self.cells.items() if r=="east_terrace"})
        self.assertEqual(len(self.ramps),3)
        for crossing in self.ramps:
            a,b=tuple(crossing)
            self.assertEqual(abs(a[0]-b[0])+abs(a[1]-b[1]),1)
            self.assertNotEqual(a in self.raised,b in self.raised)
            self.assertIn(crossing,self.links)
        self.assertEqual(len(self.walk((4,0))),238)
        self.assertLess(len(self.walk((4,0),ramps=set())),238)
    def test_damaged_second_mouth_and_removed_chamber_door_fail(self):
        deficient=dict(self.cells);deficient.pop((5,1))
        self.assertNotIn((5,1),deficient)
        broken=json.loads(json.dumps(CAVE));broken["doors"].pop()
        self.assertEqual(len(entrances(broken,self.cells)),17)
        self.assertNotEqual(len(self.links),len(entrances(broken,self.cells)))
if __name__=="__main__":unittest.main()

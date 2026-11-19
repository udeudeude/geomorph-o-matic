"""Independent Lantern Sink geometry validation."""
import copy,json,unittest
from pathlib import Path
from validate import validate,validate_terrain,footprint
ROOT=Path(__file__).resolve().parents[1]
TILE=next(t for t in json.loads((ROOT/"blueprints.json").read_text())["tiles"] if t["id"]=="lantern_sink")
def floor(tile):
    cells={}
    for name,_,shape in tile["rooms"]:
        for p in footprint(shape):
            if p in cells:raise AssertionError("overlapping rooms")
            cells[p]=name
    for route in tile["routes"]:
        for a,b in zip(route["points"],route["points"][1:]):
            for x in range(min(a[0],b[0]),max(a[0],b[0])+1):
                for y in range(min(a[1],b[1]),max(a[1],b[1])+1):
                    if cells.get((x,y),"hall")!="hall":raise AssertionError("route touches room")
                    cells[x,y]="hall"
    return cells
class LanternSinkTests(unittest.TestCase):
    def test_blueprint_and_independent_cave_model(self):
        r=validate(TILE)
        self.assertEqual(r["rooms"],7);self.assertEqual(r["water_cells"],4)
        self.assertEqual(r["bridges"],2);self.assertEqual(r["ramps"],3)
        self.assertEqual(r["cave_choke_edges"],1);self.assertEqual(r["cave_detail_cells"],12)
    def test_bad_terrain_fails(self):
        original=floor(TILE)
        for name,value in (("bridges",[[8,9]]),("ramps",[[[14,8],[14,10]]]),
                           ("chokes",[[[4,0],[4,1]]]),("elevations",[[1,[[14,8],[4,0]]]])):
            t=copy.deepcopy(TILE);t["terrain"][name]=value
            with self.assertRaises(AssertionError):validate_terrain(t,original)
if __name__=="__main__":unittest.main()

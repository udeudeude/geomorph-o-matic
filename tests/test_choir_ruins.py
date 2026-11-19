"""Independent validation of the Fallen Choir rubble and upper floor."""
import copy
import json
import unittest
from pathlib import Path
from validate import validate_terrain,validate_vertical,footprint

SOURCE=json.loads((Path(__file__).resolve().parents[1]/"blueprints.json").read_text())
CHOIR=next(t for t in SOURCE["tiles"] if t["id"]=="fallen_choir")
def occupied(tile):
    result={}
    for identifier,_,shape in tile["rooms"]:
        for p in footprint(shape):
            assert p not in result
            result[p]=identifier
    for route in tile["routes"]:
        for a,b in zip(route["points"],route["points"][1:]):
            assert a[0]==b[0] or a[1]==b[1]
            for x in range(min(a[0],b[0]),max(a[0],b[0])+1):
                for y in range(min(a[1],b[1]),max(a[1],b[1])+1):
                    assert result.get((x,y),"hall")=="hall"
                    result[(x,y)]="hall"
    return result

class ChoirArchitectureTests(unittest.TestCase):
    def setUp(self):
        self.tile=copy.deepcopy(CHOIR)
        self.floor=occupied(self.tile)

    def test_true_blocked_arcade_and_separate_upper_plan(self):
        self.assertEqual(validate_terrain(self.tile,self.floor)["ruined_wall_edges"],5)
        vertical=validate_vertical(self.tile,self.floor)
        self.assertEqual(vertical["stacked_floor_cells"],4)
        self.assertEqual(vertical["vertical_connections"],2)

    def test_ruin_cannot_be_unblocked_or_repeated(self):
        self.tile["terrain"]["barriers"].pop()
        with self.assertRaises(AssertionError):
            validate_terrain(self.tile,self.floor)
        self.tile=copy.deepcopy(CHOIR)
        self.tile["terrain"]["ruins"].append(self.tile["terrain"]["ruins"][0])
        with self.assertRaises(AssertionError):
            validate_terrain(self.tile,self.floor)

    def test_unsupported_upper_wall_crossing_rejected(self):
        self.tile["vertical"]["decks"][0]["cells"].append([12,9])
        self.tile["vertical"]["decks"][0]["cells"].append([13,9])
        with self.assertRaises(AssertionError):
            validate_vertical(self.tile,self.floor)
if __name__=="__main__":
    unittest.main()

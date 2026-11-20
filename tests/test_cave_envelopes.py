"""Independent Python reading of authored passage cuts and modular seam intent."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "blueprints.json").read_text())


def floor(tile):
    cells = {}
    for name, _, shape in tile["rooms"]:
        runs = shape["rows"] if isinstance(shape, dict) else [
            [y, shape[0], shape[2]] for y in range(shape[1], shape[3]+1)]
        for y, a, b in runs:
            for x in range(a, b+1):
                assert (x,y) not in cells
                cells[x,y] = name
    for route in tile["routes"]:
        for (ax,ay),(bx,by) in zip(route["points"],route["points"][1:]):
            assert ax == bx or ay == by
            for x in range(min(ax,bx),max(ax,bx)+1):
                for y in range(min(ay,by),max(ay,by)+1):
                    assert cells.get((x,y),"hall") == "hall"
                    cells[x,y] = "hall"
    return cells


class CaveEnvelopeIndependentTests(unittest.TestCase):
    def test_real_floor_widths_at_geologically_distinct_cuts(self):
        by_id = {t["id"]:t for t in DATA["tiles"]}
        for tile_name, at, across, expected in [
            ("scoured_siphon",(8,3),"E-W",3),
            ("scoured_siphon",(8,4),"E-W",2),
            ("basalt_rift",(8,8),"N-S",1),
            ("lantern_sink",(6,4),"E-W",2),
        ]:
            cells = floor(by_id[tile_name])
            self.assertEqual(cells[at], "hall")
            dx,dy = (1,0) if across == "E-W" else (0,1)
            width = 1
            for direction in (-1,1):
                x,y = at
                while cells.get((x+direction*dx,y+direction*dy)) == "hall":
                    x += direction*dx
                    y += direction*dy
                    width += 1
            self.assertEqual(width, expected, (tile_name,at))

    def test_no_canonical_cave_silently_acquires_wide_portal(self):
        for tile in DATA["tiles"]:
            boundary = {p for p in floor(tile) if 0 in p or 19 in p}
            self.assertEqual(len(boundary),8)
            self.assertEqual(boundary,{
                (4,0),(15,0),(4,19),(15,19),
                (0,4),(0,15),(19,4),(19,15)})
        note = (ROOT / "research" / "2026-11-20-cave-seam-envelopes.md").read_text()
        self.assertIn("Independent, incompatible", note)
        self.assertIn("not measured", note.lower())

if __name__ == "__main__":
    unittest.main()

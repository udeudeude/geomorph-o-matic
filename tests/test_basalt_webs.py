"""Independent Python reconstruction of the Basalt Rift's authored bedrock webs."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TILE = next(t for t in json.loads((ROOT / "blueprints.json").read_text())["tiles"]
            if t["id"] == "basalt_rift")


def build_floor(tile):
    floor = {}
    for name, _, shape in tile["rooms"]:
        for y, lo, hi in shape["rows"]:
            for x in range(lo, hi + 1):
                assert (x, y) not in floor, (name, x, y)
                floor[(x, y)] = name
    for route in tile["routes"]:
        pts = route["points"]
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            assert ax == bx or ay == by
            for y in range(min(ay, by), max(ay, by) + 1):
                for x in range(min(ax, bx), max(ax, bx) + 1):
                    assert floor.get((x, y), "hall") == "hall", (route["id"], x, y)
                    floor[x, y] = "hall"
    return floor


class BasaltBedrockTests(unittest.TestCase):
    def test_real_two_cell_rock_webs_have_dry_floor_flanks(self):
        floor = build_floor(TILE)
        for left, rock, right in [
            ((6, 9), ((7, 9), (8, 9)), (9, 9)),
            ((12, 9), ((13, 9), (14, 9)), (15, 9)),
        ]:
            self.assertEqual(floor[left], "hall")
            self.assertEqual(floor[right], "hall")
            self.assertTrue(all(cell not in floor for cell in rock))
            self.assertEqual(len(rock) * 2.5, 5)

    def test_new_offsets_are_walkable_and_legacy_portal_cells_untouched(self):
        floor = build_floor(TILE)
        for coord in ((6, 8), (15, 8), (6, 9), (15, 9)):
            self.assertEqual(floor[coord], "hall")
        border = {p for p in floor if 0 in p or 19 in p}
        self.assertEqual(border, {
            (4, 0), (15, 0), (4, 19), (15, 19),
            (0, 4), (0, 15), (19, 4), (19, 15)
        })

    def test_wider_rock_web_is_not_a_claim_of_measured_roof_strength(self):
        self.assertEqual(len([p for p in ((7, 9), (8, 9)) if p not in build_floor(TILE)]), 2)
        study = (ROOT / "research" / "2026-11-20-basalt-rock-webs.md").read_text()
        self.assertIn("roof thickness", study)
        self.assertIn("not a field survey", study)


if __name__ == "__main__":
    unittest.main()

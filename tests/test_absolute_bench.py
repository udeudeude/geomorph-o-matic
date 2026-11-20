"""Independent blueprint checks for two incompatible absolute roof scenarios.
We validate coordinates and step continuity without importing JavaScript model code.
"""
import json
import unittest
from pathlib import Path
from test_sheetflow_cave import occupancy
ROOT=Path(__file__).resolve().parents[1]
TILE=next(t for t in json.loads((ROOT/"wide-blueprints.json").read_text())["tiles"] if t["id"]=="sagging_sheet")

class AbsoluteBenchTests(unittest.TestCase):
 def test_fixed_and_lifted_roofs_have_different_real_headroom(self):
  occupied=occupancy(TILE)
  levels={tuple(p):elevation for elevation,points in TILE["terrain"]["elevations"] for p in points}
  self.assertEqual(len(levels),8)
  self.assertTrue(all(level==1 and cell in occupied for cell,level in levels.items()))
  baseline=TILE["roof_scenario"]["baseline_feet"]
  self.assertEqual(baseline,6.5)
  fixed={p:baseline-levels.get(p,0) for p in occupied}
  lifted={p:baseline for p in occupied}
  self.assertEqual(sum(h<6 for h in fixed.values()),8)
  self.assertEqual(sum(h<6 for h in lifted.values()),0)
  self.assertEqual(sum(h>=6 for h in fixed.values()),len(occupied)-8)
  self.assertEqual(len(occupied),238)

 def test_stairs_are_three_distinct_one_foot_physical_changes(self):
  levels={tuple(p):n for n,points in TILE["terrain"]["elevations"] for p in points}
  stairs=TILE["terrain"]["steps"]
  self.assertEqual(len(stairs),3)
  upper=[]
  for stair in stairs:
   a,b=map(tuple,stair["edge"])
   self.assertEqual(abs(a[0]-b[0])+abs(a[1]-b[1]),1)
   self.assertEqual(abs(levels.get(a,0)-levels.get(b,0)),1)
   self.assertEqual((stair["rise_feet"],stair["risers"]),(1,2))
   self.assertEqual(stair["rise_feet"]/stair["risers"],0.5)
   upper.append(a if a in levels else b)
  self.assertEqual(len(set(upper)),3)
  mouths={(x,y) for x in (0,19) for y in (4,5,14,15)}
  mouths.update((x,y) for y in (0,19) for x in (4,5,14,15))
  self.assertTrue(mouths.isdisjoint(levels))
if __name__=="__main__":
 unittest.main()

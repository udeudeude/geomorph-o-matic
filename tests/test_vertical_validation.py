"""Independent stacked-floor contract checks for the dungeon blueprint."""
import unittest
from validate import validate_vertical

class VerticalTests(unittest.TestCase):
    def setUp(self):
        self.cells={(x,9):'hall' for x in range(1,9)}
        self.tile={'id':'test','vertical':{
            'decks':[{'id':'gantry','level':1,'cells':[[x,9] for x in range(2,7)]}],
            'links':[{'at':[2,9],'from':0,'to':1,'kind':'ladder'},
                     {'at':[6,9],'from':0,'to':1,'kind':'ladder'}]
        }}

    def test_usable_connected_overhead_floor(self):
        report=validate_vertical(self.tile,self.cells)
        self.assertEqual(report['stacked_floor_cells'],5)
        self.assertEqual(report['vertical_connections'],2)

    def test_missing_link_and_disconnected_floor_rejected(self):
        self.tile['vertical']['links']=[]
        with self.assertRaises(AssertionError):
            validate_vertical(self.tile,self.cells)
        self.tile['vertical']['links']=[{'at':[2,9],'from':0,'to':1,'kind':'ladder'}]
        self.tile['vertical']['decks'][0]['cells']=[[2,9],[6,9]]
        with self.assertRaises(AssertionError):
            validate_vertical(self.tile,self.cells)

    def test_duplicate_and_impossible_connections_rejected(self):
        links=self.tile['vertical']['links']
        links.append(dict(links[0]))
        with self.assertRaises(AssertionError):
            validate_vertical(self.tile,self.cells)
        links.pop()
        links[0]['kind']='stair'
        links[0]['to']=3
        with self.assertRaises(AssertionError):
            validate_vertical(self.tile,self.cells)

    def test_no_new_boundary_portal_and_no_phantom_walkway(self):
        self.cells[(0,9)]='hall'
        self.tile['vertical']['decks'][0]['cells'].insert(0,[0,9])
        with self.assertRaises(AssertionError):
            validate_vertical(self.tile,self.cells)
        self.tile['vertical']['decks'][0]['cells'].pop(0)
        self.tile['vertical']['decks'][0]['cells'][0]=[11,9]
        with self.assertRaises(AssertionError):
            validate_vertical(self.tile,self.cells)

if __name__=='__main__':
    unittest.main()

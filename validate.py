"""Validate hand-authored geomorph blueprints without third-party dependencies.

Usage: python validate.py [path/to/blueprints.json]
"""
import collections
import json
import sys
from pathlib import Path

SIZE = 20
PORTALS = {(4,0),(15,0),(0,4),(19,4),(0,15),(19,15),(4,19),(15,19)}
NEIGHBORS = ((1,0),(-1,0),(0,1),(0,-1))

def pair(a,b):
    return tuple(sorted((a,b)))

def rotate(p,turns):
    x,y=p
    for _ in range(turns%4):x,y=19-y,x
    return (x,y)

def connected(cells,blocked,start):
    found={start};queue=collections.deque([start])
    while queue:
        x,y=queue.popleft()
        for dx,dy in NEIGHBORS:
            q=(x+dx,y+dy)
            if q in cells and q not in found and pair((x,y),q) not in blocked:
                found.add(q);queue.append(q)
    return found

def footprint(shape):
    if isinstance(shape, dict):
        rows = shape['rows']
    else:
        x1, y1, x2, y2 = shape
        rows = [[y, x1, x2] for y in range(y1, y2 + 1)]
    cells = set()
    for y, x1, x2 in rows:
        assert all(isinstance(n, int) for n in (y, x1, x2)) and 0 <= y < SIZE and 0 <= x1 <= x2 < SIZE, ('invalid chamber run', y, x1, x2)
        for x in range(x1, x2 + 1):
            assert (x, y) not in cells, ('overlapping chamber run', x, y)
            cells.add((x, y))
    assert cells and connected(cells, set(), next(iter(cells))) == cells, 'disconnected chamber footprint'
    return cells

def validate(tile):
    name=tile['id'];cells={};chambers={}
    for key,title,shape in tile['rooms']:
        assert key not in chambers,(name,'duplicate chamber',key)
        footprint_cells=footprint(shape)
        chambers[key]=(min(x for x,y in footprint_cells),min(y for x,y in footprint_cells),max(x for x,y in footprint_cells),max(y for x,y in footprint_cells))
        for p in footprint_cells:
            assert p not in cells,(name,'overlapping rooms',p)
            cells[p]=key
    for route in tile['routes']:
        points=route['points']
        assert len(points)>=2,(name,'short route',route['id'])
        for (x,y),(xx,yy) in zip(points,points[1:]):
            assert x==xx or y==yy,(name,'diagonal route',route['id'])
            for i in range(min(x,xx),max(x,xx)+1):
                for j in range(min(y,yy),max(y,yy)+1):
                    assert 0<=i<20 and 0<=j<20,(name,'route outside map')
                    assert (i,j) not in cells or cells[(i,j)]=='hall',(name,'route intersects room',route['id'],i,j)
                    cells[(i,j)]='hall'
    boundary={p for p in cells if 0 in p or 19 in p}
    assert boundary==PORTALS,(name,'invalid edge openings',boundary^PORTALS)
    walls=set()
    for (x,y),zone in cells.items():
        for dx,dy in NEIGHBORS:
            q=(x+dx,y+dy)
            if q in cells and cells[q]!=zone:walls.add(pair((x,y),q))
    doors=set();by_room=collections.Counter()
    for room,side,offset,kind in tile['doors']:
        assert room in chambers and kind in ('door','secret','locked')
        x1,y1,x2,y2=chambers[room]
        if side=='N':a,b=(offset,y1),(offset,y1-1)
        elif side=='S':a,b=(offset,y2),(offset,y2+1)
        elif side=='W':a,b=(x1,offset),(x1-1,offset)
        elif side=='E':a,b=(x2,offset),(x2+1,offset)
        else:raise AssertionError((name,'invalid doorway direction'))
        e=pair(a,b)
        assert cells.get(a)==room and cells.get(b)=='hall' and e in walls and e not in doors,(name,'invalid door',room,side,offset)
        doors.add(e);by_room[room]+=1
    assert len(doors)<=max(8,2*len(chambers)) and all(by_room[key] for key in chambers),(name,'door budget')
    assert connected(cells,walls-doors,(4,0))==set(cells),(name,'disconnected walkable regions')
    hall={p for p,z in cells.items() if z=='hall'}
    assert connected(hall,set(),(4,0))==hall,(name,'disconnected corridors')
    links=sum(((x+dx,y+dy) in hall) for x,y in hall for dx,dy in ((1,0),(0,1)))
    loops=links-len(hall)+1
    assert loops>=3,(name,'insufficient alternate routes',loops)
    return {'id':name,'rooms':len(chambers),'doors':len(doors),'corridor_cycles':loops,'floor_cells':len(cells)}

def main():
    data=json.loads(Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).with_name('blueprints.json')).read_text())
    assert {rotate(p,r) for p in PORTALS for r in range(4)}==PORTALS,'portals are not rotation-invariant'
    reports=[validate(t) for t in data['tiles']]
    for r in reports:print(f"PASS {r['id']}: {r['rooms']} chambers, {r['doors']} doors, {r['corridor_cycles']} hall loops")
    print(f"PASS {len(reports)} geomorphs; exact edge mask survives all quarter-turns")

if __name__=='__main__':main()

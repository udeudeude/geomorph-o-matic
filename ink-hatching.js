"use strict";
// Original outside-wall chisel marks for masonry geomorphs.
// Strokes occupy *rock*, never traversable floor. A directional normal
// preserves legibility at doors and the eight modular perimeter portals.
function masonryHatchPaths(owner,unit=24,size=20){
  if(!(owner instanceof Map))throw Error("Masonry hatching requires a floor-owner Map");
  if(!Number.isFinite(unit)||unit<=0||!Number.isInteger(size)||size<=0)throw Error("Invalid hatch scale");
  const rock=(x,y)=>x>=0&&y>=0&&x<size&&y<size&&!owner.has(x+","+y);
  const lines=[];
  for(const pos of owner.keys()){
    const [x,y]=pos.split(",").map(Number);
    for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
      if(!rock(x+dx,y+dy))continue;
      // Two different offset cuts per facing. The short diagonals are
      // hand-sized at half-inch squares, leaving generous untouched rock.
      for(const t of [.31,.72]){
        let sx,sy,ex,ey;
        if(dx){
          sx=(x+(dx>0?1:0))*unit+dx*2;
          sy=(y+t)*unit;
          ex=sx+dx*7;ey=sy-3;
        }else{
          sx=(x+t)*unit;
          sy=(y+(dy>0?1:0))*unit+dy*2;
          ex=sx+4;ey=sy+dy*7;
        }
        const v=n=>Number(n.toFixed(2));
        lines.push(`M${v(sx)},${v(sy)}L${v(ex)},${v(ey)}`);
      }
    }
  }
  return lines.join(" ");
}
module.exports={masonryHatchPaths};

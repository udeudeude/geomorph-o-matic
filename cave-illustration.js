"use strict";
// Cave-only cartography. Visual shoreline is derived from occupied wet cells;
// the navigation graph continues to use the authoritative cell data.
const {naturalWallPaths}=require("./cave-contours");
const POS=p=>p.join(",");
const val=n=>Number(n.toFixed(2));

function shorelinePaths(water,cellSize=24,gridSize=20){
 if(!(water instanceof Set)||!(cellSize>0)||!Number.isInteger(gridSize)||gridSize<2)
  throw Error("Invalid natural shoreline inputs");
 const segments=[];
 for(const key of [...water].sort()){
  const p=key.split(",").map(Number),[x,y]=p;
  if(p.length!==2||!p.every(Number.isInteger)||x<0||y<0||x>=gridSize||y>=gridSize)
   throw Error("Invalid shoreline cell");
  if(!water.has(POS([x,y-1])))segments.push([x,y,x+1,y]);
  if(!water.has(POS([x+1,y])))segments.push([x+1,y,x+1,y+1]);
  if(!water.has(POS([x,y+1])))segments.push([x,y+1,x+1,y+1]);
  if(!water.has(POS([x-1,y])))segments.push([x,y,x,y+1]);
 }
 return naturalWallPaths(segments,{cellSize,gridSize,radius:.18});
}
function naturalWaterSvg(water,cellSize=24,gridSize=20){
 if(!water.size)return [];
 return ['<g id="water-terrain" fill="#a6cbd0" fill-opacity=".8" stroke="#6b959b" stroke-width="1.1" fill-rule="evenodd">',
  ...shorelinePaths(water,cellSize,gridSize).map(d=>'<path d="'+d+'"/>'),'</g>'];
}

// Non-blocking floor deposits. A "choke" is separately encoded as a BLOCKED
// traversable edge in terrain.chokes; these deposits never imply a blockage.
const KINDS=["breakdown","flowstone","gravel","scallops"];
function caveDetailSvg(owner,terrain,vertical={},details={},cellSize=24,gridSize=20){
 if(!(owner instanceof Map)||!terrain||!(terrain.water instanceof Set)||
    !details||Array.isArray(details)||typeof details!=="object")
  throw Error("Invalid cave detail inputs");
 if(!(cellSize>0)||!Number.isInteger(gridSize)||gridSize<2)
  throw Error("Invalid cave detail scale");
 for(const name of Object.keys(details))if(!KINDS.includes(name))throw Error("Unknown cave detail: "+name);
 const ladders=new Set((vertical.links||[]).map(link=>POS(link.at)));
 const used=new Set(),out=[];
 for(const kind of KINDS){
  const cells=details[kind]||[];
  if(!Array.isArray(cells))throw Error("Cave detail cells must be an array");
  for(const p of cells){
   if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger))throw Error("Invalid cave detail coordinate");
   const [x,y]=p,k=POS(p);
   if(x<1||y<1||x>=gridSize-1||y>=gridSize-1||
      !owner.has(k)||terrain.water.has(k)||terrain.bridges.has(k)||
      ladders.has(k)||used.has(k))throw Error("Cave detail must occupy unique, dry, interior floor away from ladders");
   used.add(k);
   const cx=(x+.5)*cellSize,cy=(y+.5)*cellSize,r=cellSize/24;
   const m=(dx,dy)=>val(cx+dx*r)+","+val(cy+dy*r);
   let drawing="";
   if(kind==="breakdown"){
    drawing='<path d="M'+m(-9,5)+'L'+m(-6,-4)+' '+m(-1,-8)+' '+m(4,-5)+' '+m(9,2)+' '+m(5,8)+' '+m(-5,9)+'Z" fill="#d5d0c4" stroke="#575b55" stroke-width="1.2"/>'+
      '<path d="M'+m(-6,-4)+'L'+m(-1,1)+' '+m(4,-5)+' M'+m(-1,1)+'L'+m(5,8)+' M'+m(-5,9)+'L'+m(-1,1)+'" stroke="#8b877c" stroke-width=".75" fill="none"/>';
   }else if(kind==="flowstone"){
    drawing='<path d="M'+m(-9,-6)+'Q'+m(-4,-10)+' '+m(0,-5)+'T'+m(9,-6)+
      ' M'+m(-9,-2)+'Q'+m(-4,-6)+' '+m(0,-1)+'T'+m(9,-2)+
      ' M'+m(-9,2)+'Q'+m(-4,-2)+' '+m(0,3)+'T'+m(9,2)+
      ' M'+m(-8,6)+'Q'+m(-4,3)+' '+m(0,7)+'T'+m(8,6)+'" fill="none" stroke="#7a786b" stroke-width="1.25"/>';
   }else if(kind==="gravel"){
    drawing='<ellipse cx="'+val(cx)+'" cy="'+val(cy)+'" rx="'+val(9*r)+'" ry="'+val(7*r)+'" fill="#e5e0d4" fill-opacity=".45" stroke="none"/>'+
      '<path d="M'+m(-7,-3)+'l'+val(3*r)+','+val(-2*r)+' '+val(2*r)+','+val(3*r)+
      ' M'+m(1,-6)+'l'+val(3*r)+','+val(2*r)+' '+val(-2*r)+','+val(2*r)+
      ' M'+m(-5,4)+'l'+val(2*r)+','+val(-2*r)+' '+val(3*r)+','+val(2*r)+
      ' M'+m(3,4)+'l'+val(3*r)+','+val(-2*r)+'" fill="none" stroke="#928879" stroke-width="1.15" stroke-linecap="round"/>';
   }else {
    drawing='<path d="M'+m(-9,-6)+'q'+val(5*r)+','+val(-4*r)+' '+val(10*r)+',0'+
      ' M'+m(-6,0)+'q'+val(5*r)+','+val(-4*r)+' '+val(10*r)+',0'+
      ' M'+m(-3,6)+'q'+val(5*r)+','+val(-4*r)+' '+val(10*r)+',0" fill="none" stroke="#8b8a7b" stroke-width="1.1"/>';
   }
   out.push('<g data-geology="'+kind+'" data-cell="'+k+'">'+drawing+'</g>');
  }
 }
 return out.length?['<g id="cave-geomorphology">',...out,'</g>']:[];
}
module.exports={shorelinePaths,naturalWaterSvg,caveDetailSvg};

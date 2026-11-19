"use strict";
const coordinate=p=>p.join(",");
const number=n=>Number(n.toFixed(2));
const at=(a,b,fraction)=>[a[0]+(b[0]-a[0])*fraction,a[1]+(b[1]-a[1])*fraction];
const commands=p=>`${number(p[0])},${number(p[1])}`;

function chainsFromEdges(segments){
 const edges=[],endpoints=new Map(),registered=new Set();
 for(const segment of segments){
  if(!Array.isArray(segment)||segment.length<4)throw Error("Invalid wall segment");
  const a=segment.slice(0,2),b=segment.slice(2,4);
  if(a.every((v,i)=>v===b[i]))throw Error("Zero-length wall segment");
  const ak=coordinate(a),bk=coordinate(b),identity=[ak,bk].sort().join("|");
  if(registered.has(identity))continue;
  registered.add(identity);
  const i=edges.length;edges.push([a,b]);
  for(const p of[ak,bk]){if(!endpoints.has(p))endpoints.set(p,[]);endpoints.get(p).push(i);}
 }
 const unused=new Set(edges.map((_,i)=>i));
 const trace=(start,firstEdge)=>{
  const chain=[start];let cursor=start,next=firstEdge;
  while(next!==undefined&&unused.has(next)){
   unused.delete(next);
   const[a,b]=edges[next];
   cursor=coordinate(a)===coordinate(cursor)?b:a;
   chain.push(cursor);
   if(coordinate(cursor)===coordinate(start))break;
   const candidates=(endpoints.get(coordinate(cursor))||[]).filter(i=>unused.has(i));
   if(candidates.length!==1)break;
   next=candidates[0];
  }
  return chain;
 };
 const result=[];
 for(const[id,indices]of endpoints)if(indices.length!==2){
  const point=id.split(",").map(Number);
  for(const index of indices)if(unused.has(index))result.push(trace(point,index));
 }
 while(unused.size){const first=[...unused][0];result.push(trace(edges[first][0],first));}
 return result;
}

function naturalWallPaths(segments,{cellSize=24,gridSize=20,radius=0.2}={}){
 if(radius<0||radius>0.25)throw Error("Corner smoothing must remain inside the half-cell");
 const scale=p=>[p[0]*cellSize,p[1]*cellSize];
 const isBorder=([x,y])=>x===0||y===0||x===gridSize||y===gridSize;
 const curveAt=(prev,curr,next)=>{
  const[a,b,c]=[prev,curr,next].map(scale);
  const cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
  if(!cross||isBorder(curr))return`L${commands(b)}`;
  const short=Math.min(Math.hypot(b[0]-a[0],b[1]-a[1]),Math.hypot(c[0]-b[0],c[1]-b[1]));
  const inset=Math.min(radius*cellSize,short*0.3);
  const before=at(b,a,inset/Math.hypot(b[0]-a[0],b[1]-a[1]));
  const after=at(b,c,inset/Math.hypot(c[0]-b[0],c[1]-b[1]));
  return`L${commands(before)}Q${commands(b)} ${commands(after)}`;
 };
 return chainsFromEdges(segments).map(chain=>{
  if(chain.length<2)return"";
  const closed=coordinate(chain[0])===coordinate(chain[chain.length-1]);
  if(!closed){
   let d=`M${commands(scale(chain[0]))}`;
   for(let i=1;i<chain.length-1;i++)d+=curveAt(chain[i-1],chain[i],chain[i+1]);
   return d+`L${commands(scale(chain[chain.length-1]))}`;
  }
  const points=chain.slice(0,-1);
  if(points.length<3)return"";
  const halfway=at(scale(points[0]),scale(points[1]),0.5);
  let d=`M${commands(halfway)}`;
  for(let i=1;i<=points.length;i++){
   const k=i%points.length;
   d+=curveAt(points[(k-1+points.length)%points.length],points[k],points[(k+1)%points.length]);
  }
  return d+`L${commands(halfway)}Z`;
 }).filter(Boolean);
}

// Input is [x1,y1,x2,y2,outwardDx,outwardDy], outward from traversable floor.
function rockHachurePaths(segments,{cellSize=24,gridSize=20}={}){
 const paths=[];
 for(const[x1,y1,x2,y2,nx,ny]of segments){
  if(!Number.isInteger(nx)||!Number.isInteger(ny)||Math.abs(nx)+Math.abs(ny)!==1)throw Error("Invalid rock-facing normal");
  const cx=(x1+x2)/2,cy=(y1+y2)/2;
  if(cx<=0||cy<=0||cx>=gridSize||cy>=gridSize)continue;
  const tangential=[y2-y1,x1-x2];
  for(let j=0;j<2;j++){
   const t=j===0?-0.26:0.26,px=cx+t*(x2-x1),py=cy+t*(y2-y1);
   const distance=j===0?0.28:0.4;
   const a=[px*cellSize+nx*1.6,py*cellSize+ny*1.6];
   const b=[a[0]+nx*distance*cellSize+tangential[0]*1.4,
    a[1]+ny*distance*cellSize+tangential[1]*1.4];
   if(b[0]<0||b[1]<0||b[0]>gridSize*cellSize||b[1]>gridSize*cellSize)continue;
   paths.push(`M${commands(a)}L${commands(b)}`);
  }
 }
 return paths;
}
module.exports={chainsFromEdges,naturalWallPaths,rockHachurePaths};

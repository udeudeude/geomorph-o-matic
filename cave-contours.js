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

// Catmull-Rom-inspired cubic contours with deterministic sub-cell curvature.
// This is an illustrative wall layer: validated traversable floor and door
// edges remain unchanged. Any segment touching the outside boundary is exact.
function rockFacingOffsets(segments,{cellSize=24,gridSize=20,irregularity=.13}={}){
 if(!(cellSize>0)||!Number.isInteger(gridSize)||gridSize<2||irregularity<0||irregularity>.18)
  throw Error("Unsafe cave wall offset controls");
 const normals=new Map();
 const add=(p,n)=>{
  const k=coordinate(p);
  if(!normals.has(k))normals.set(k,{point:p,vectors:[]});
  normals.get(k).vectors.push(n);
 };
 for(const segment of segments){
  if(segment.length<6)continue;
  const [x1,y1,x2,y2,nx,ny]=segment;
  if(![x1,y1,x2,y2].every(Number.isFinite)||
     !Number.isInteger(nx)||!Number.isInteger(ny)||Math.abs(nx)+Math.abs(ny)!==1)
   throw Error("Rock-facing cave wall requires unit outward normal");
  add([x1,y1],[nx,ny]);add([x2,y2],[nx,ny]);
 }
 const moved=new Map();
 for(const [key,{point:[x,y],vectors}] of normals){
  const X=x*cellSize,Y=y*cellSize;
  if(x===0||y===0||x===gridSize||y===gridSize){moved.set(key,[X,Y]);continue;}
  const sx=vectors.reduce((sum,v)=>sum+v[0],0),sy=vectors.reduce((sum,v)=>sum+v[1],0);
  const length=Math.hypot(sx,sy);
  if(!length){moved.set(key,[X,Y]);continue;}
  let hash=2166136261;
  for(let i=0;i<key.length;i++)hash=Math.imul(hash^key.charCodeAt(i),16777619)>>>0;
  const amount=cellSize*Math.min(irregularity*.85,.15)*(.4+.6*(hash/4294967295));
  moved.set(key,[X+sx/length*amount,Y+sy/length*amount]);
 }
 return moved;
}

function organicWallPaths(segments,{cellSize=24,gridSize=20,curvature=0.16,irregularity=0.13}={}){
 if(!(cellSize>0)||!Number.isInteger(gridSize)||gridSize<2||
    curvature<0||curvature>0.22||irregularity<0||irregularity>0.18)throw Error("Unsafe organic wall controls");
 const border=([x,y])=>x===0||y===0||x===gridSize||y===gridSize;
 const moved=rockFacingOffsets(segments,{cellSize,gridSize,irregularity});
 const cp=p=>moved.get(coordinate(p))||[p[0]*cellSize,p[1]*cellSize];
 const edgeKey=(a,b)=>[coordinate(a),coordinate(b)].sort().join("|");
 const facing=new Map();
 for(const segment of segments)if(segment.length>=6)
  facing.set(edgeKey(segment.slice(0,2),segment.slice(2,4)),segment.slice(4,6));
 const hash=(a,b)=>{
  const keys=edgeKey(a,b);
  let h=2166136261;
  for(let i=0;i<keys.length;i++)h=Math.imul(h^keys.charCodeAt(i),16777619)>>>0;
  return h/4294967295;
 };
 return chainsFromEdges(segments).map(chain=>{
  const closed=coordinate(chain[0])===coordinate(chain[chain.length-1]);
  const pts=closed?chain.slice(0,-1):chain;
  if(pts.length<2)return "";
  const n=pts.length;
  let d="M"+commands(cp(pts[0]));
  for(let i=0;i<(closed?n:n-1);i++){
   const a=pts[i],b=pts[(i+1)%n],A=cp(a),B=cp(b);
   if(border(a)||border(b)){d+="L"+commands(B);continue;}
   const prev=cp(pts[i===0?(closed?n-1:0):i-1]);
   const next=cp(pts[i+2<n?i+2:(closed?(i+2)%n:n-1)]);
   const outward=facing.get(edgeKey(a,b));
   const length=Math.hypot(B[0]-A[0],B[1]-A[1]);
   const wobble=irregularity*cellSize*(.25+.55*hash(a,b));
   const normal=outward||[-(B[1]-A[1])/length,(B[0]-A[0])/length];
   const p=[A[0]+curvature*(B[0]-prev[0])+normal[0]*wobble,
    A[1]+curvature*(B[1]-prev[1])+normal[1]*wobble];
   const q=[B[0]-curvature*(next[0]-A[0])+normal[0]*wobble,
    B[1]-curvature*(next[1]-A[1])+normal[1]*wobble];
   d+="C"+commands(p)+" "+commands(q)+" "+commands(B);
  }
  return d+(closed?"Z":"");
 }).filter(Boolean);
}
module.exports={chainsFromEdges,naturalWallPaths,organicWallPaths,rockFacingOffsets,rockHachurePaths};

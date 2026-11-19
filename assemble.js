"use strict";
const fs=require("node:fs"),path=require("node:path");
const {shapeCells}=require("./geometry");
const CELL=20,UNIT=24,SIDE=CELL*UNIT;
const inBounds=([x,y])=>x>=0&&y>=0&&x<CELL&&y<CELL;

const key=([x,y])=>`${x},${y}`;

function rotateCell(p,turns){let [x,y]=p;for(let n=0;n<turns;n++)[x,y]=[CELL-1-y,x];return[x,y]}

function buildCells(tile){
 const map=new Map();
 for(const [id,,shape] of tile.rooms)for(const [x,y] of shapeCells(shape)){
  if(!inBounds([x,y])||map.has(key([x,y])))throw Error(`${tile.id}: overlapping chamber`);map.set(key([x,y]),id);
 }
 for(const r of tile.routes)for(let i=1;i<r.points.length;i++){
  const [ax,ay]=r.points[i-1],[bx,by]=r.points[i];
  if(ax!==bx&&ay!==by)throw Error(`${tile.id}: diagonal corridor`);
  for(let x=Math.min(ax,bx);x<=Math.max(ax,bx);x++)for(let y=Math.min(ay,by);y<=Math.max(ay,by);y++){
   if(!inBounds([x,y])||(map.has(key([x,y]))&&map.get(key([x,y]))!=="hall"))throw Error(`${tile.id}: corridor intersects room`);
   map.set(key([x,y]),"hall");
  }
 }
 return map;
}

function edgeMask(tile,turn,side){
 const floor=new Set([...buildCells(tile).keys()].map(s=>key(rotateCell(s.split(",").map(Number),turn))));
 const mask=[];
 for(let i=0;i<CELL;i++){
  const p=side==="N"?[i,0]:side==="S"?[i,CELL-1]:side==="W"?[0,i]:[CELL-1,i];
  if(floor.has(key(p)))mask.push(i);
 }
 return mask.join(",");
}

function verifyLayout(layout,data){
 if(!layout||!Array.isArray(layout.rows)||!layout.rows.length)throw Error("Empty layout");
 const width=layout.rows[0].length;if(!width)throw Error("Empty arrangement row");
 const byId=new Map(data.tiles.map(t=>[t.id,t]));
 const rows=layout.rows.map((row,y)=>{
  if(!Array.isArray(row)||row.length!==width)throw Error("Jagged arrangement");
  return row.map((cell,x)=>{
   if(!cell||!byId.has(cell.id)||!Number.isInteger(cell.turn)||cell.turn<0||cell.turn>3)throw Error(`Invalid tile or turn at ${x},${y}`);
   return {...cell,tile:byId.get(cell.id)};
  });
 });
 for(let y=0;y<rows.length;y++)for(let x=0;x<width;x++){
  const a=rows[y][x];
  if(x+1<width){
   const b=rows[y][x+1];
   if(edgeMask(a.tile,a.turn,"E")!==edgeMask(b.tile,b.turn,"W"))throw Error(`East-west seam mismatch ${x},${y}`);
  }
  if(y+1<rows.length){
   const b=rows[y+1][x];
   if(edgeMask(a.tile,a.turn,"S")!==edgeMask(b.tile,b.turn,"N"))throw Error(`North-south seam mismatch ${x},${y}`);
  }
 }
 return rows;
}

function instanceSvg(svg,suffix){
 if(!/^\s*<svg\b/.test(svg))throw Error("Master is not an SVG document");
 const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 for(const id of ids){
  svg=svg.replaceAll(`id="${id}"`,`id="${id}-${suffix}"`)
    .replaceAll(`url(#${id})`,`url(#${id}-${suffix})`)
    .replaceAll(`href="#${id}"`,`href="#${id}-${suffix}"`);
 }
 return svg.replace(/<svg\b[^>]*>/,'<svg x="0" y="0" width="480" height="480" viewBox="0 0 480 480">');
}

function transform(x,y,turn){
 if(turn===0)return`translate(${x*SIDE} ${y*SIDE})`;
 if(turn===1)return`translate(${(x+1)*SIDE} ${y*SIDE}) rotate(90)`;
 if(turn===2)return`translate(${(x+1)*SIDE} ${(y+1)*SIDE}) rotate(180)`;
 return`translate(${x*SIDE} ${(y+1)*SIDE}) rotate(270)`;
}

function assemble(layout,data,svgById){
 const rows=verifyLayout(layout,data),w=rows[0].length,h=rows.length;
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w*SIDE} ${h*SIDE}" role="img">`,
  `<title>${String(layout.title||"Geomorph assembly").replaceAll("&","&amp;").replaceAll("<","&lt;")}</title>`,
  `<desc>${w} by ${h} modular dungeon survey; each tile has ten conventional grid squares per side.</desc>`];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const c=rows[y][x],master=svgById(c.id);
  if(!master)throw Error(`Missing SVG: ${c.id}`);
  parts.push(`<g id="assembly-${x}-${y}" transform="${transform(x,y,c.turn)}">`,instanceSvg(master,`${x}-${y}`),"</g>");
 }
 return parts.join("\n")+"\n</svg>\n";
}
if(require.main===module){const root=__dirname;const spec=path.resolve(process.argv[2]||path.join(root,"examples/assembly_3x3.json"));const dest=path.resolve(process.argv[3]||path.join(root,"examples/assembly_3x3.svg"));const layout=JSON.parse(fs.readFileSync(spec,"utf8")),data=JSON.parse(fs.readFileSync(path.join(root,"blueprints.json"),"utf8"));const result=assemble(layout,data,id=>fs.readFileSync(path.join(root,"tiles",id+".svg"),"utf8"));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,result);console.log("Assembly written to "+dest);}
module.exports={rotateCell,buildCells,edgeMask,verifyLayout,assemble,instanceSvg};

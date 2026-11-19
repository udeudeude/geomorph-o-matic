"use strict";
const fs=require("node:fs");
const path=require("node:path");
const {shapeCells,shapeBounds}=require("./geometry");
const {organicWallPaths,rockHachurePaths}=require("./cave-contours");
const {terrainSvg}=require("./terrain");
const {verticalSvg}=require("./vertical");
const {gateSvg}=require("./hydraulic-control");
const {waterworksSvg}=require("./waterworks");
const {tailraceSymbolsSvg}=require("./tailrace");
function makeSvg(tile,{grid="full"}={}) {
  if(!["full","half"].includes(grid))throw Error("Invalid map grid");
  const N=20,S=24,L=N*S,portal=new Set(["4,0","15,0","0,4","19,4","0,15","19,15","4,19","15,19"]);
  const key=(x,y)=>`${x},${y}`,edge=(a,b)=>[a,b].sort().join("|");
  const owner=new Map(),rooms=new Map();
  for(const [id,name,shape] of tile.rooms){
    const [x1,y1,x2,y2]=shapeBounds(shape);
    rooms.set(id,{name,x1,y1,x2,y2});
    for(const [x,y] of shapeCells(shape)){
      if(owner.has(key(x,y)))throw Error("Overlapping rooms: "+tile.id);
      owner.set(key(x,y),id);
    }
  }
  for(const route of tile.routes){
    for(let j=1;j<route.points.length;j++){
      const [x,y]=route.points[j-1],[xx,yy]=route.points[j];
      if(x!==xx&&y!==yy)throw Error("Diagonal route: "+route.id);
      for(let a=Math.min(x,xx);a<=Math.max(x,xx);a++)for(let b=Math.min(y,yy);b<=Math.max(y,yy);b++){
        if(a<0||a>=20||b<0||b>=20||owner.has(key(a,b))&&owner.get(key(a,b))!=="hall")throw Error("Illegal route: "+route.id);
        owner.set(key(a,b),"hall");
      }
    }
  }
  const boundary=[...owner.keys()].filter(p=>{const [x,y]=p.split(",").map(Number);return x===0||x===19||y===0||y===19;});
  if(boundary.length!==8||boundary.some(p=>!portal.has(p)))throw Error("Invalid boundary openings: "+tile.id);
  const doors=new Map();
  for(const [id,side,n,kind] of tile.doors){
    const r=rooms.get(id);let a,b;
    if(side==="N"){a=[n,r.y1];b=[n,r.y1-1]}
    else if(side==="S"){a=[n,r.y2];b=[n,r.y2+1]}
    else if(side==="W"){a=[r.x1,n];b=[r.x1-1,n]}
    else if(side==="E"){a=[r.x2,n];b=[r.x2+1,n]}
    else throw Error("Bad door");
    if(owner.get(key(...a))!==id||owner.get(key(...b))!=="hall")throw Error("Door mismatch: "+id);
    doors.set(edge(key(...a),key(...b)),{a,b,kind});
  }
  const cave=tile.wall_style==="cavern";
  const naturalEdges=[];
  const outline=[];
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  const seen=new Set();
  for(const [p,z] of owner.entries()){
    const [x,y]=p.split(",").map(Number);
    for(const [dx,dy] of dirs){
      const q=key(x+dx,y+dy),qz=owner.get(q),e=edge(p,q);
      if(qz&&qz===z||doors.has(e)||seen.has(e))continue;
      if(qz)seen.add(e);
      else if((x+dx<0||x+dx>=20||y+dy<0||y+dy>=20)&&portal.has(p))continue;
      if(cave&&!qz){
        const a=dx===1?[x+1,y,x+1,y+1,1,0]:dx===-1?[x,y,x,y+1,-1,0]:dy===1?[x,y+1,x+1,y+1,0,1]:[x,y,x+1,y,0,-1];
        naturalEdges.push(a);
        continue;
      }
      if(dx===1)outline.push(["V",x+1,y,y+1]);
      else if(dx===-1)outline.push(["V",x,y,y+1]);
      else if(dy===1)outline.push(["H",y,x,x+1]);
      else outline.push(["H",y,x,x+1]);
    }
  }
  const grouped=new Map();
  for(const [dir,c,a,b] of outline){
    const group=dir+":"+c; if(!grouped.has(group))grouped.set(group,[]);
    grouped.get(group).push([a,b]);
  }
  const strokes=[];
  for(const [group,list] of grouped){
    const [dir,n]=group.split(":"),c=Number(n);list.sort((a,b)=>a[0]-b[0]);
    let a=list[0][0],b=list[0][1];
    function push(){strokes.push(dir==="H"?`M${a*S},${c*S}H${b*S}`:`M${c*S},${a*S}V${b*S}`)}
    for(const [x,y] of list.slice(1)){if(x<=b)b=Math.max(b,y);else{push();a=x;b=y}}
    push();
  }
  const floorpath=[...owner.keys()].map(p=>{const [x,y]=p.split(",").map(Number);return `M${x*S},${y*S}h${S}v${S}h-${S}z`}).join(" ");
  const clip="walk-"+tile.id;
  const parts=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${L}" role="img" aria-label="${tile.title}">`,
    `<title>${tile.title}</title>`,`<defs><clipPath id="${clip}"><path d="${floorpath}"/></clipPath></defs>`,
    `<rect width="${L}" height="${L}" fill="#e7e3d9"/>`,
    `<g id="rock-texture" fill="none" stroke="#aaa59a" stroke-width=".8" opacity=".45">`];
  // Restrained stone etching only near carved rock; deterministic across renders.
  if(!cave)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    if(owner.has(key(x,y)))continue;
    if(!dirs.some(([dx,dy])=>owner.has(key(x+dx,y+dy))))continue;
    for(let n=0;n<3;n++){let X=x*S+4+n*6,Y=y*S+3+((x*7+y*3+n*5)%8);parts.push(`<path d="M${X},${Y}l6,6"/>`)}
  }
  parts.push(`</g><g id="floor"><path d="${floorpath}" fill="#fffcf3"/></g>`);
  parts.push(`<g id="grid" data-grid="${grid}" clip-path="url(#${clip})" fill="none">`);
  for(let i=1;i<N;i++){if(grid==="full"&&i%2)continue;const k=i*S,stroke=i%2?"#d8d5cb":"#b9b6ae",sw=i%2?".5":".95";parts.push(`<path d="M${k},0V${L} M0,${k}H${L}" stroke="${stroke}" stroke-width="${sw}"/>`)}
  parts.push(`</g>`);
  for(const layer of terrainSvg(owner,tile.terrain||{}))parts.push(layer);
  for(const layer of waterworksSvg(owner,[...doors.values()],tile.hydrology||{},tile.terrain||{}))parts.push(layer);
  for(const layer of tailraceSymbolsSvg(owner,[...doors.values()],tile.hydrology||{},tile.terrain||{}))parts.push(layer);
  parts.push(`<g id="features">`);
  function rect(box,pad=0){const [x1,y1,x2,y2]=box;return [x1*S+pad,y1*S+pad,(x2-x1+1)*S-2*pad,(y2-y1+1)*S-2*pad]}
  function shape(kind,coord){
    const center=([x,y])=>[(x+.5)*S,(y+.5)*S];
    if(kind==="pool"){
      const [x,y,w,h]=rect(coord,4);parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#b7d2d5" stroke="#48777b" stroke-width="2.4"/>`);
      for(let i=0;i<4;i++)parts.push(`<path d="M${x+12},${y+14+i*26}q13,-6 26,0t26,0t26,0" fill="none" stroke="#7ca6a7" stroke-width="1.2"/>`);
      parts.push(`<circle cx="${x+w/2}" cy="${y+h/2}" r="19" fill="#e8e9df" stroke="#48777b" stroke-width="2"/><circle cx="${x+w/2}" cy="${y+h/2}" r="8" fill="none" stroke="#48777b" stroke-width="2"/>`);
    }else if(["table","sarcophagus","altar"].includes(kind)){
      const [x,y,w,h]=rect(coord,6),fill=kind==="table"?"#e2caaa":"#d8d0c0";
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${kind==="sarcophagus"?5:2}" fill="${fill}" stroke="#494843" stroke-width="1.8"/>`);
      if(kind==="sarcophagus")parts.push(`<rect x="${x+5}" y="${y+5}" width="${w-10}" height="${h-10}" fill="none" stroke="#887e6b"/>`);
    }else if(kind==="columns"){
      for(const p of coord){const [x,y]=center(p);parts.push(`<circle cx="${x}" cy="${y}" r="7" fill="#e2ddcd" stroke="#41413c" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3" fill="none" stroke="#777166"/>`)}
    }else if(kind==="beds"){
      const [x,y,w,h]=rect(coord,4);const count=Math.max(1,Math.floor(w/34));
      for(let i=0;i<count;i++){const a=x+i*(w/count)+2,v=w/count-4;parts.push(`<rect x="${a}" y="${y}" width="${v}" height="${h}" rx="3" fill="#ded7ca" stroke="#716b60" stroke-width="1.4"/><rect x="${a+2}" y="${y+2}" width="${v-4}" height="8" fill="#faf6ea" stroke="#716b60" stroke-width=".6"/>`)}
    }else if(kind==="tombrows"){
      const [x,y,w,h]=rect(coord,3);for(let a=0;a<h-14;a+=22)parts.push(`<rect x="${x}" y="${y+a}" width="${w}" height="16" fill="#d6ccbc" stroke="#716b60" stroke-width="1"/>`);
    }else if(kind==="stairs"){
      const [x,y,w,h]=rect(coord,5);parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#eee9df" stroke="#716b60" stroke-width=".9"/>`);
      for(let a=9;a<h;a+=10)parts.push(`<path d="M${x},${y+a}h${w}" stroke="#716b60" stroke-width="1"/>`);
    }else if(["rubble","barrels","arrowslits"].includes(kind)){
      for(const p of coord){const [x,y]=center(p);
        if(kind==="rubble")parts.push(`<path d="M${x-9},${y+4}l5,-10 9,4 3,8 -9,3z" fill="#bbb8ad" stroke="#6d6a61"/>`);
        if(kind==="barrels")parts.push(`<circle cx="${x}" cy="${y}" r="8" fill="#d5bb95" stroke="#6d6a61" stroke-width="1.5"/><path d="M${x-5},${y}h10" stroke="#6d6a61"/>`);
        if(kind==="arrowslits")parts.push(`<path d="M${x-7},${y}h14 M${x},${y-7}v14" stroke="#41413c" stroke-width="1.6"/>`);
      }
    }else if(kind==="portcullis"){
      const [x,y]=center(coord);parts.push(`<path d="M${x-4},${y-12}v24m4,-24v24m4,-24v24 M${x-6},${y-7}h12m-12,7h12m-12,7h12" fill="none" stroke="#313433" stroke-width="1.9"/>`);
    }else if(kind==="wheel"){
      const [x,y]=center(coord);parts.push(`<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#303331" stroke-width="2.4"/>`);
      for(let i=0;i<6;i++){const a=i*Math.PI/3;parts.push(`<path d="M${x},${y}L${(x+10*Math.cos(a)).toFixed(2)},${(y+10*Math.sin(a)).toFixed(2)}" stroke="#303331" stroke-width="1.3"/>`)}
    }
  }
  for(const [kind,coord] of tile.features)shape(kind,coord);
  parts.push(`</g><g id="stone-walls" fill="none" stroke-linecap="square" stroke-linejoin="round">`);
  for(const path of strokes)parts.push(`<path d="${path}" stroke="#8e8a80" opacity=".32" stroke-width="5.5"/><path d="${path}" stroke="#303332" stroke-width="2.8"/>`);
  if(cave){
    parts.push(`</g>`);
    parts.push(`<g id="rock-hachures" fill="none" stroke="#79776d" stroke-width="1" opacity=".65">`);
    for(const p of rockHachurePaths(naturalEdges))parts.push(`<path d="${p}"/>`);
    parts.push(`</g><g id="cavern-walls" fill="none" stroke-linecap="round" stroke-linejoin="round">`);
    for(const p of organicWallPaths(naturalEdges)){
      parts.push(`<path d="${p}" stroke="#8e8a80" stroke-width="5.5" opacity=".32"/><path d="${p}" stroke="#303332" stroke-width="2.8"/>`);
    }
    parts.push(`</g>`);
  }
  parts.push(cave?`<g id="explicit-doors" fill="none" stroke="#484743">`:`</g><g id="explicit-doors" fill="none" stroke="#484743">`);
  for(const {a,b,kind} of doors.values()){
    const vertical=a[0]!==b[0];
    const X=(vertical?Math.max(a[0],b[0]):a[0])*S,Y=(vertical?a[1]:Math.max(a[1],b[1]))*S;
    if(kind==="secret"){parts.push(vertical?`<path d="M${X},${Y}v${S}" stroke="#303332" stroke-width="2.7" stroke-dasharray="6,2"/>`:`<path d="M${X},${Y}h${S}" stroke="#303332" stroke-width="2.7" stroke-dasharray="6,2"/>`);continue;}
    if(vertical){
      parts.push(`<path d="M${X-3},${Y}h6 M${X-3},${Y+S}h6" stroke-width="2.7"/>`);
      parts.push(`<path d="M${X},${Y}l17,17" stroke="#8a745f" stroke-width="1.6"/>`);
      if(kind==="locked")parts.push(`<path d="M${X-6},${Y+S/2}h12" stroke-width="2.3"/>`);
    }else{
      parts.push(`<path d="M${X},${Y-3}v6 M${X+S},${Y-3}v6" stroke-width="2.7"/>`);
      parts.push(`<path d="M${X},${Y}l17,17" stroke="#8a745f" stroke-width="1.6"/>`);
      if(kind==="locked")parts.push(`<path d="M${X+S/2},${Y-6}v12" stroke-width="2.3"/>`);
    }
  }
  parts.push(`</g>`);
  for(const layer of gateSvg(owner,[...doors.values()],tile.hydrology||{}))parts.push(layer);
  for(const layer of verticalSvg(owner,tile.terrain||{},tile.vertical||{}))parts.push(layer);
  parts.push(`</svg>`);
  return parts.join("\n")+"\n";
}

if(require.main===module){
  const root=__dirname;
  const source=JSON.parse(fs.readFileSync(path.join(root,"blueprints.json"),"utf8"));
  fs.mkdirSync(path.join(root,"tiles"),{recursive:true});
  for(const tile of source.tiles){
    const filename=path.join(root,"tiles",tile.id+".svg");
    fs.writeFileSync(filename,makeSvg(tile),"utf8");
    process.stdout.write(filename+"\n");
  }
}
module.exports={makeSvg};

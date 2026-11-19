"use strict";
// Paired plans and a deliberately schematic cut through a selected half-cell row.
// Vertical spacing is illustrative: tile plan grid and edge portals remain exact.
const {buildCells}=require("./assemble");
const {terrainModel}=require("./terrain");
const {verticalModel}=require("./vertical");
const {makeSvg}=require("./render");
const UNIT=24, SIDE=480;
const escapeXml=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const coord=s=>s.split(",").map(Number);
function sectionPlate(tile,{row=10}={}){
 if(!Number.isInteger(row)||row<1||row>18)throw Error("Section row must be an interior integer");
 const owner=buildCells(tile),terrain=terrainModel(owner,tile.terrain||{}),model=verticalModel(owner,tile.terrain||{},tile.vertical||{});
 if(!model.decks.size)throw Error("Section plates require an independently modeled upper deck");
 const levels=[...new Set([...model.decks.values()].map(d=>d.level))].sort((a,b)=>a-b);
 if(levels.length!==1||levels[0]!==1)throw Error("This two-level plate supports a +1 deck only");
 if(![...model.decks.values()].some(deck=>[...deck.cells].some(p=>coord(p)[1]===row)))
  throw Error("Section must cross a modeled upper deck");
 const master=makeSvg({...tile,vertical:{}}).replace(/^<svg\b[^>]*>/,
  '<svg x="20" y="91" width="480" height="480" viewBox="0 0 480 480" role="group">');
 const title=escapeXml(tile.title);
 const out=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 880" role="img" aria-label="${title}: two plans and schematic cross section">`,
  `<title>${title} | Levels and section</title>`,
  '<rect width="1040" height="880" fill="#f8f7f3"/>',
  '<text x="20" y="35" font-family="Georgia,serif" font-size="26" fill="#282c2b">'+title+'</text>',
  '<text x="20" y="58" font-family="sans-serif" font-size="12" fill="#5b625e">Independent plan surfaces and a traced section. The section is schematic, not vertically to scale.</text>',
  '<text x="20" y="83" font-family="sans-serif" font-size="14" font-weight="bold">A. Lower plan (with raised floor annotations)</text>',
  '<text x="540" y="83" font-family="sans-serif" font-size="14" font-weight="bold">B. Upper plan: physical deck at +1</text>',
  '<g id="lower-plan">',master,
  `<path d="M20 ${91+(row+.5)*UNIT}H500" fill="none" stroke="#a33724" stroke-width="1.6" stroke-dasharray="7 5"/>`,
  `<text x="24" y="${89+(row+.5)*UNIT}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#a33724">A</text>`,
  `<text x="482" y="${89+(row+.5)*UNIT}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#a33724">A'</text>`,
  '</g>',
  '<g id="upper-plan">','<rect x="540" y="91" width="480" height="480" fill="#edece7" stroke="#96938b" stroke-width=".8"/>'];
 // Ground projection is context only; it is never rendered as a walkable upper surface.
 out.push('<g id="lower-floor-projection" fill="#c9cbc6" fill-opacity=".35">');
 for(const p of owner.keys()){const [x,y]=coord(p);out.push(`<rect x="${540+x*UNIT}" y="${91+y*UNIT}" width="24" height="24"/>`)}
 out.push('</g><g id="raised-base-surfaces" fill="#f8f0d7" stroke="#81765f" stroke-width=".7">');
 for(const [p,z] of terrain.heights)if(z===1){const [x,y]=coord(p);out.push(`<rect x="${540+x*UNIT}" y="${91+y*UNIT}" width="24" height="24"/>`)}
 out.push('</g><g id="upper-deck-surfaces" fill="#ddba88" stroke="#634f38" stroke-width="1.2">');
 for(const deck of model.decks.values())for(const p of deck.cells){const [x,y]=coord(p);out.push(`<rect x="${540+x*UNIT}" y="${91+y*UNIT}" width="24" height="24"/>`)}
 out.push('</g><g id="upper-plan-links" font-family="sans-serif" text-anchor="middle" font-size="12" fill="#3b332b">');
 for(const link of model.links){const [x,y]=coord(link.at),cx=540+(x+.5)*UNIT,cy=91+(y+.5)*UNIT;
  out.push(`<circle cx="${cx}" cy="${cy}" r="9" fill="#fff8e7" stroke="#574a40" stroke-width="1.7"/>`,
   `<text x="${cx}" y="${cy+4}">${link.kind==="ladder"?"L":"S"}</text>`)}
 out.push('</g>',`<path d="M540 ${91+(row+.5)*UNIT}H1020" stroke="#a33724" stroke-width="1.6" stroke-dasharray="7 5"/>`,'</g>',
  '<text x="20" y="594" font-family="sans-serif" font-size="12" fill="#3f443f">Gold: constructed deck | Cream: raised existing floor | Gray: lower floor projection | L: ladder</text>',
  '<text x="20" y="630" font-family="sans-serif" font-size="15" font-weight="bold">C. Section A–A\u2032 through row '+row+'</text>',
  '<text x="20" y="652" font-family="sans-serif" font-size="12" fill="#686760">Longitudinal grid alignment is exact. Floor-to-deck distance and water depth are illustrative.</text>',
  '<g id="section" transform="translate(56 670)">',
  '<path d="M0 54H880 M0 123H880" fill="none" stroke="#d2d2cb" stroke-dasharray="3 6"/>',
  '<text x="-38" y="58" font-size="11" font-family="sans-serif" fill="#6e6257">+1</text>',
  '<text x="-38" y="127" font-size="11" font-family="sans-serif" fill="#6e6257">0</text>');
 const pitch=44;
 for(let x=0;x<20;x++){
  const p=x+","+row,baseHeight=terrain.heights.get(p)||0,deck=[...model.decks.values()].some(d=>d.cells.has(p));
  if(owner.has(p)){
   const at=baseHeight===1?54:123;
   if(terrain.water.has(p))out.push(`<rect x="${x*pitch}" y="${at+2}" width="${pitch}" height="26" fill="#87b8be" fill-opacity=".7"/>`);
   out.push(`<path d="M${x*pitch} ${at}h${pitch}" stroke="${terrain.bridges.has(p)?"#a17842":"#3d4440"}" stroke-width="${terrain.bridges.has(p)?5:4}"/>`);
  }
  if(deck)out.push(`<path d="M${x*pitch} 54h${pitch}" stroke="#b1804d" stroke-width="8"/>`);
 }
 for(const link of model.links){const [x,y]=coord(link.at);if(y!==row)continue;
  const X=(x+.5)*pitch;
  out.push(`<path d="M${X} 54V123" stroke="#463d35" stroke-width="2" stroke-dasharray="4 3"/>`,
   `<text x="${X+5}" y="85" font-family="sans-serif" font-size="10">${link.kind==="ladder"?"L":"S"}</text>`);
 }
 for(let x=0;x<=20;x+=2)out.push(`<text x="${x*pitch}" y="160" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#777">${x}</text>`);
 out.push('</g>','<text x="20" y="861" font-size="11" font-family="sans-serif" fill="#666">Canonical coordinates are half-square cells; separate decks never imply a dry route through water below.</text>','</svg>');
 return out.join("\n")+"\n";
}
if(require.main===module){
 const fs=require("node:fs"),path=require("node:path");
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const tile=data.tiles.find(t=>t.id==="riftwater_lock");
 const dest=path.resolve(process.argv[2]||path.join(__dirname,"examples/riftwater_section.svg"));
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,sectionPlate(tile),"utf8");
 console.log("Section plate written: "+dest);
}
module.exports={sectionPlate};

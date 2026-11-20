"use strict";
// A true-size US Letter *proof* with an audit of small strokes and type.
// SVG viewBox units are 96 per inch for physical output; no rasterization.
const {makeSvg}=require("./render");
const {spec:seamSpec}=require("./seam-profiles");
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const num=n=>Number(n.toFixed(3));
function validateScale(squareInches){
 if(typeof squareInches!=="number"||!Number.isFinite(squareInches)||
    squareInches<0.25||squareInches>0.65)throw Error("Invalid print grid size");
}
function printScaleAudit(tile,{squareInches=0.5}={}){
 validateScale(squareInches);
 const svg=makeSvg(tile),mouthCells=seamSpec(tile.seam_profile||"legacy").mouths[0].length,mmPerUnit=squareInches*25.4/48; // 48 vector units/full square
 const type=[...svg.matchAll(/font-size="([0-9.]+)"/g)].map(x=>Number(x[1]));
 const strokes=[...svg.matchAll(/stroke-width="([0-9.]+)"/g)].map(x=>Number(x[1]));
 const smallType=type.filter(x=>x*mmPerUnit<2.2);
 const hairlines=strokes.filter(x=>x*mmPerUnit<0.15);
 return {tile:tile.id,full_square_inches:squareInches,tile_width_mm:num(squareInches*254),
  half_cell_width_feet:2.5,standard_edge_throat_feet:mouthCells*2.5,
  standard_edge_throat_print_mm:num(squareInches*25.4*mouthCells/2),
  millimetres_per_vector_unit:num(mmPerUnit),font_samples:type.length,
  type_below_2_2_mm:smallType.length,stroke_samples:strokes.length,
  strokes_below_0_15_mm:hairlines.length,
  minimum_type_mm:type.length?num(Math.min(...type)*mmPerUnit):null,
  minimum_stroke_mm:strokes.length?num(Math.min(...strokes)*mmPerUnit):null,
  requires_visual_review:true};
}
function letterProof(tile,{squareInches=0.5}={}){
 validateScale(squareInches);
 const width=squareInches*960; // ten 1/2-inch squares -> 480 CSS px
 const x=(816-width)/2,y=130;
 const original=makeSvg(tile);
 const nested=original.replace(/^<svg\b[^>]*>/,
  '<svg x="'+num(x)+'" y="'+y+'" width="'+num(width)+'" height="'+num(width)+'" viewBox="0 0 480 480" role="group">');
 const info=printScaleAudit(tile,{squareInches}),small=info.type_below_2_2_mm;
 const bar=squareInches*192,half=bar/2,barY=y+width+74,barX=(816-bar)/2;
 if(barY+105>1056)throw Error("Tile too large for letter proof furniture");
 const out=[
 '<svg xmlns="http://www.w3.org/2000/svg" width="215.9mm" height="279.4mm" viewBox="0 0 816 1056" role="img" aria-label="US Letter physical print proof">',
 '<title>'+esc(tile.title)+' | True-size print proof</title>',
 '<rect width="816" height="1056" fill="#fffdf8"/>',
 '<g id="proof-head" font-family="sans-serif" fill="#272b29">',
 '<text x="76" y="53" font-size="23" font-family="Georgia,serif">'+esc(tile.title)+'</text>',
 '<text x="76" y="82" font-size="13">Geomorph-o-matic | Architectural print inspection, not final artwork</text>',
 '<text x="76" y="102" font-size="12">US Letter | Actual size / 100% | 5-foot square = '+squareInches+' in | Tile = '+num(width/96)+' in</text>',
 '</g><g id="print-map">',nested,'</g>',
 '<g id="print-scale" font-family="sans-serif" font-size="12" fill="#313735">',
 '<text x="76" y="'+num(barY-20)+'">10-foot scale bar (two standard squares)</text>',
 '<rect x="'+num(barX)+'" y="'+num(barY)+'" width="'+num(half)+'" height="18" fill="#27312c"/>',
 '<rect x="'+num(barX+half)+'" y="'+num(barY)+'" width="'+num(half)+'" height="18" fill="#fffcf3" stroke="#27312c" stroke-width="1"/>',
 '<text x="'+num(barX)+'" y="'+num(barY+37)+'">0</text>',
 '<text x="'+num(barX+bar)+'" y="'+num(barY+37)+'" text-anchor="end">10 ft</text>',
 '</g>',
 '<g id="print-review-footer" fill="#5a605c" font-family="sans-serif" font-size="12">',
 '<text x="76" y="988">Print at 100%. Edge throats are '+info.standard_edge_throat_feet+' ft clear ('+(info.standard_edge_throat_print_mm)+' mm on paper).</text>',
 '<text x="76" y="1010">Automated typography check: '+small+' directly sized text elements below 2.2 mm.</text>',
 '<text x="76" y="1031">Visual clarity must be assessed from a physical test print.</text>',
 '</g></svg>'
 ];
 return out.join("\n")+"\n";
}
if(require.main===module){
 const fs=require("node:fs"),path=require("node:path");
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const report=data.tiles.map(t=>printScaleAudit(t));
 const out=path.join(__dirname,"reports/print-scale.json");
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");
 const selected=process.argv[3]||"riftwater_lock";
 const tile=data.tiles.find(t=>t.id===selected);
 if(!tile)throw Error("Unknown print-proof tile: "+selected);
 const dest=path.resolve(process.argv[2]||path.join(__dirname,"examples/riftwater_print_letter.svg"));
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,letterProof(tile));
 console.log("Print audit and US Letter proof generated: "+dest);
 console.log(JSON.stringify(report,null,2));
}
module.exports={printScaleAudit,letterProof};

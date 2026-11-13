const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for (const [name,dir] of [['logo3d-iso','1,0.82,1'],['logo3d-low','1,0.55,1.1']]){
const W=1400,H=1400;const p=await b.newPage({viewport:{width:W,height:H}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+path.resolve('scene.html')+`?scene=logomark&style=real&w=${W}&h=${H}&alpha=1&dir=${dir}`);
await p.waitForFunction(()=>window.DONE===true,{timeout:120000});
const data=await p.evaluate(()=>document.querySelector('canvas').toDataURL('image/png'));
fs.writeFileSync(`out3d/${name}.png`,Buffer.from(data.split(',')[1],'base64'));await p.close();console.log('ok',name);}
await b.close();})();

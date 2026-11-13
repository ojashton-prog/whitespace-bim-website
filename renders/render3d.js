const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const jobs=process.argv.slice(2);
for(const j of jobs){const [scene,style,crop,name]=j.split(":");const W=2000,H=1250;
const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
p.on('console',m=>console.log(scene,style,m.text()));p.on('pageerror',e=>console.log('ERR',scene,e.message));
await p.goto('file://'+path.resolve('scene.html')+`?scene=${scene}&style=${style}&w=${W}&h=${H}${crop&&crop!=="close"?"&crop="+crop:""}${crop==="close"?"&view=close":""}`);
await p.waitForFunction(()=>window.DONE===true,{timeout:120000});
const data=await p.evaluate(()=>document.querySelector('canvas').toDataURL('image/png'));
require('fs').writeFileSync(`out3d/${name||scene}-${style}.png`,Buffer.from(data.split(',')[1],'base64'));await p.close();console.log('ok',scene,style);}
await b.close();})();

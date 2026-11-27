const fs=require('fs'),{chromium}=require('playwright');
const dir=process.argv[2], out=process.argv[3];
const b64=f=>'data:image/jpeg;base64,'+fs.readFileSync(dir+'/'+f).toString('base64');
(async()=>{
 const br=await chromium.launch(); 
 for (const [mode,file] of [['','frame.png'],['preview','preview.png'],['preview guides','guides.png']]){
  let h=fs.readFileSync(dir+'/frame.html','utf8').replace('__MODE__',mode)
   .replace('__BG__',b64('bg.jpg')).replace('__P1__',b64('p1.jpg')).replace('__P2__',b64('p2.jpg')).replace('__P3__',b64('p3.jpg'));
  const p=await br.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  await p.setContent(h,{waitUntil:'networkidle'}); await p.evaluate(()=>document.fonts.ready);
  await p.screenshot({path:out+'/'+file,omitBackground:true}); await p.close();
 }
 await br.close();
})();

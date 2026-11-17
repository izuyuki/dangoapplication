'use strict';
const characters=[
 ['ダンゴマサムネ','小さな世界を切りひらく、三日月の冒険家。','背中はいくつの節に分かれているかな？'],
 ['ダンゴドスコイ','どっしり構えて、今日もはっけよい！','歩くとき、足はどんなふうに動くかな？'],
 ['ダンゴアフロ','まんまるヘアに、ひらめきをつめこんで。','体に小さな模様はあるかな？'],
 ['ダンゴデジタル','足もとの小さな発見を、キャッチ！','触角はどちらを向いているかな？'],
 ['ダンゴエジプト','落ち葉の王国からやってきた、黄金の王さま。','近くには、どんな落ち葉があるかな？'],
 ['ダンゴースト','ふわりと現れる、かくれんぼの名人。','体と地面の色を見くらべてみよう。'],
 ['ダンゴプター','まだ見ぬ世界へ、気持ちはいつでも離陸中。','ダンゴムシの目線では、何が見えるかな？'],
 ['ダンゴキャタピラ','でこぼこ道も、のんびり進む探検隊。','どんな地面を歩いているかな？'],
 ['ダンゴニンニン','落ち葉のすきまに、するりと忍びこむ。','近くに隠れられそうな場所はあるかな？'],
 ['ダンゴポリス','足もとの平和を守る、やさしい見まわり隊。','ほかに、どんな生きものがいるかな？']
];
const $=id=>document.getElementById(id);const KEY='dango-collection-v1';let found=new Set();let canSave=true;let previewURL=null;let busy=false;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))found=new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<10));}catch{canSave=false;}
function render(){const n=found.size;$('count').innerHTML=n+' <small>/ 10</small>';$('navCount').textContent=n+' / 10';$('progress').style.width=n*10+'%';$('grid').replaceChildren();characters.forEach((c,i)=>{const card=document.createElement('button');card.className='card';card.disabled=!found.has(i);card.setAttribute('aria-label',found.has(i)?c[0]+'の詳細':'未発見の仲間 '+(i+1));card.innerHTML=(found.has(i)?'<img loading="lazy" src="assets/'+i+'.jpg" alt="'+c[0]+'">':'<span class="locked">?</span>')+'<span class="card-text"><small>NO. '+String(i+1).padStart(2,'0')+'</small><strong>'+(found.has(i)?c[0]:'まだ見ぬ仲間')+'</strong></span>';card.onclick=()=>{$('detailImage').src='assets/'+i+'.jpg';$('detailImage').alt=c[0];$('detailNumber').textContent='NO. '+String(i+1).padStart(2,'0');$('detailName').textContent=c[0];$('detailDesc').textContent=c[1];$('detail').showModal();};$('grid').append(card);});}
// Pure pixel features; no model, network request, species or object recognition.
function analyzePixels(data){let sum=0,sum2=0,sat=0,warm=0;const n=data.length/4;for(let i=0;i<data.length;i+=4){const a=data[i+3]/255,r=data[i]*a+255*(1-a),g=data[i+1]*a+255*(1-a),b=data[i+2]*a+255*(1-a);const l=.2126*r+.7152*g+.0722*b;sum+=l;sum2+=l*l;sat+=Math.max(r,g,b)-Math.min(r,g,b);warm+=r-b;}
const brightness=sum/n,contrast=Math.sqrt(Math.max(0,sum2/n-brightness**2)),saturation=sat/n,warmth=warm/n;
const index=(Math.min(9,Math.floor(brightness/25.6))+Math.floor(contrast/16)+Math.floor(saturation/24)+(warmth>15?2:warmth< -15?5:0))%10;return{index,brightness,contrast,saturation,warmth};}
async function choose(e){const file=e.target.files[0];if(!file||busy)return;e.target.value='';if(file.size>25*1024*1024){$('status').textContent='25MB以下の写真を選んでください。';return;}busy=true;$('status').textContent='写真から、仲間を探しています…';let url=URL.createObjectURL(file);try{const im=new Image();im.src=url;await im.decode();if(!im.naturalWidth)throw Error('decode');const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,96,96);ctx.drawImage(im,0,0,96,96);const f=analyzePixels(ctx.getImageData(0,0,96,96).data);const i=f.index,c=characters[i],isNew=!found.has(i);found.add(i);try{localStorage.setItem(KEY,JSON.stringify([...found]));canSave=true;}catch{canSave=false;}
if(previewURL)URL.revokeObjectURL(previewURL);previewURL=url;url=null;$('photoPreview').src=previewURL;$('resultImage').src='assets/'+i+'.jpg';$('resultImage').alt=c[0];$('newBadge').textContent=isNew?'NEW FRIEND — 新しい仲間を発見！':'HELLO AGAIN — また会えたね！';$('number').textContent='NO. '+String(i+1).padStart(2,'0')+' / 10';$('resultName').textContent=c[0];$('resultDesc').textContent=c[1];$('mission').textContent=c[2];$('features').textContent='写真の特徴：'+(f.brightness<85?'暗め':f.brightness>170?'明るめ':'おだやかな明るさ')+' / '+(f.saturation<35?'落ち着いた色':'色あざやか')+' / '+(f.contrast<40?'やわらかな明暗':'くっきりした明暗');$('saveMessage').textContent=canSave?'図鑑に保存しました。観察写真は保存していません。':'このブラウザでは保存できません。図鑑はこの画面を開いている間だけ残ります。';render();$('result').hidden=false;$('status').textContent='仲間が見つかりました！';$('result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}catch(err){$('status').textContent='写真を読み込めませんでした。JPEG・PNG・WebPなど、ブラウザで開ける画像を選んでください。';}finally{if(url)URL.revokeObjectURL(url);busy=false;}}
$('photo').addEventListener('change',choose);$('camera').addEventListener('change',choose);$('close').onclick=()=>$('detail').close();$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});render();

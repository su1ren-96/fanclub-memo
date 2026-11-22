/* HOME main visual: multi-image slideshow; same IndexedDB record, compatible with existing backup. */
(function(){
'use strict';
const ID='fc-home-visual-single-v1';
const record=()=>data.find(o=>o.id===ID&&o.type==='HOME_VISUAL');
const images=()=>record()?.images||[];
const escapeSrc=src=>e(src);
let timer=null,activeIndex=0;
window.fanclubHomeVisualMarkup=function(){
 const arr=images();
 if(!arr.length)return '<div class="home-visual-placeholder" aria-label="メイン画像はまだ登録されていません"></div>';
 return `<div class="home-visual-slideshow" aria-label="HOMEメイン画像のスライドショー">${arr.map((src,i)=>`<img class="home-visual-image home-visual-slide${i===0?' is-active':''}" src="${escapeSrc(src)}" alt="HOMEメイン画像 ${i+1}" ${i===0?'fetchpriority="high"':'loading="lazy"'}>`).join('')}</div>`;
};
function stopSlideshow(){if(timer!==null){clearInterval(timer);timer=null;}}
function syncSlideshow(){
 stopSlideshow();activeIndex=0;
 if(page!=='HOME'||selected)return;
 const slides=Array.from(document.querySelectorAll('.home-visual-slide'));
 if(slides.length<=1)return;
 timer=setInterval(()=>{
  if(page!=='HOME'||selected||!document.querySelector('.home-visual-slideshow')){stopSlideshow();return;}
  slides[activeIndex]?.classList.remove('is-active');
  activeIndex=(activeIndex+1)%slides.length;
  slides[activeIndex]?.classList.add('is-active');
 },5000);
}
async function saveImages(arr){
 const old=record();
 await put({...(old||{}),id:ID,type:'HOME_VISUAL',title:'HOMEメイン画像',images:arr,when:old?.when||today()});
 await update();
}
window.fanclubHomeVisualChoose=async function(input){
 const files=Array.from(input.files||[]);if(!files.length)return;
 const current=images();input.disabled=true;
 try{
  const added=[];
  for(const file of files){if(!file.type.startsWith('image/'))throw Error('画像ファイルを選択してください');added.push(await readFile(file));}
  await saveImages([...current,...added]);
  alert(added.length+'枚の画像を追加しました');
 }catch(error){alert('画像を保存できませんでした: '+(error.message||error))}
 finally{input.value='';if(input.isConnected)input.disabled=false;}
};
window.fanclubHomeVisualMove=async function(index,dir){
 const arr=[...images()],to=index+dir;
 if(to<0||to>=arr.length)return;
 [arr[index],arr[to]]=[arr[to],arr[index]];
 try{await saveImages(arr)}catch(error){alert('並べ替えできませんでした: '+(error.message||error));}
};
window.fanclubHomeVisualRemoveAt=async function(index){
 const arr=[...images()];if(!arr[index]||!confirm('この画像を削除しますか？'))return;
 arr.splice(index,1);
 try{await saveImages(arr)}catch(error){alert('削除できませんでした: '+(error.message||error));}
};
window.fanclubHomeVisualRemove=async function(){
 if(!images().length||!confirm('HOMEのメイン画像をすべて削除しますか？'))return;
 try{await erase(ID);await update()}catch(error){alert('削除できませんでした: '+(error.message||error));}
};
const priorRenderVisual=render;
render=function(){
 const result=priorRenderVisual();
 if(page==='SETTINGS'&&!selected){
  const app=document.getElementById('app');
  if(app){
   const arr=images();
   const items=arr.map((src,i)=>`<div class="home-visual-settings-item"><img src="${escapeSrc(src)}" alt="画像 ${i+1}"><div class="home-visual-settings-controls"><span>${i+1} / ${arr.length}</span><button class="button secondary" type="button" onclick="fanclubHomeVisualMove(${i},-1)" ${i===0?'disabled':''}>↑</button><button class="button secondary" type="button" onclick="fanclubHomeVisualMove(${i},1)" ${i===arr.length-1?'disabled':''}>↓</button><button class="button secondary" type="button" onclick="fanclubHomeVisualRemoveAt(${i})">削除</button></div></div>`).join('');
   app.insertAdjacentHTML('beforeend',`<div class="card" id="homeVisualSettings"><h3>HOMEメイン画像</h3><p class="muted">複数枚を5秒ごとにフェード切り替え。縦長3:4・画面横幅いっぱいで表示します。写真は必要に応じて切り抜かれます。</p><p class="muted">登録画像：${arr.length}枚</p>${items?`<div class="home-visual-settings-list">${items}</div>`:''}<label class="field">画像を追加（複数選択できます）<input id="fanclubHomeVisualSave" type="file" accept="image/*" multiple onchange="fanclubHomeVisualChoose(this)"></label>${arr.length?'<button class="button secondary" type="button" onclick="fanclubHomeVisualRemove()">すべてのメイン画像を削除</button>':''}</div>`);
  }
 }
 syncSlideshow();
 return result;
};
})();

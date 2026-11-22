/* HOME cover image: stored as an ordinary IndexedDB item, included in existing JSON backups. */
(function(){
'use strict';
const ID='fc-home-visual-single-v1';
const record=()=>data.find(o=>o.id===ID&&o.type==='HOME_VISUAL');
window.fanclubHomeVisualMarkup=function(){
 const src=record()?.images?.[0];
 return src?`<img class="home-visual-image" src="${e(src)}" alt="HOMEメイン画像">`:'<div class="home-visual-placeholder" aria-label="メイン画像はまだ登録されていません"></div>';
};
window.fanclubHomeVisualChoose=async function(input){
 const file=input.files?.[0];if(!file)return;
 const button=document.getElementById('fanclubHomeVisualSave');
 if(button)button.disabled=true;
 try{
  if(!file.type.startsWith('image/'))throw Error('画像ファイルを選択してください');
  const src=await readFile(file);
  const old=record();
  await put({...(old||{}),id:ID,type:'HOME_VISUAL',title:'HOMEメイン画像',images:[src],when:old?.when||today()});
  await update();
  alert('HOMEメイン画像を保存しました');
 }catch(error){alert('メイン画像を保存できませんでした: '+(error.message||error))}
 finally{input.value='';if(button?.isConnected)button.disabled=false}
};
window.fanclubHomeVisualRemove=async function(){
 if(!record()||!confirm('HOMEのメイン画像を削除しますか？'))return;
 try{await erase(ID);await update()}catch(error){alert('削除できませんでした: '+(error.message||error))}
};
const priorRenderVisual=render;
render=function(){
 const result=priorRenderVisual();
 if(page==='SETTINGS'&&!selected){
  const app=document.getElementById('app');
  if(app){
   const exists=!!record()?.images?.[0];
   app.insertAdjacentHTML('beforeend',`<div class="card" id="homeVisualSettings"><h3>HOMEメイン画像</h3><p class="muted">画面幅いっぱいの縦長（3:4）画像として表示します。写真は必要に応じて切り抜かれます。</p>${exists?'<p class="muted">画像登録済み</p>':'<p class="muted">画像未登録</p>'}<label class="field">${exists?'画像を変更':'画像を登録'}<input id="fanclubHomeVisualSave" type="file" accept="image/*" onchange="fanclubHomeVisualChoose(this)"></label>${exists?'<button class="button secondary" type="button" onclick="fanclubHomeVisualRemove()">メイン画像を削除</button>':''}</div>`);
  }
 }
 return result;
};
})();

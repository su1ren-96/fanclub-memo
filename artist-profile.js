/* Standalone artist PROFILE. One record in existing IndexedDB `items` store.
   Separate from MY PAGE member profile and FEED/MESSAGE account management. */
(function(){
'use strict';
const PROFILE_ID='fc-artist-profile-single-v1';
const defaults=['生年月日','出身地','身長','血液型','趣味','特技'];
const artistRecord=()=>data.find(o=>o.id===PROFILE_ID&&o.type==='PROFILE')||data.find(o=>o.type==='PROFILE');
let fieldDraft=[],photoDraft='',editingProfile=false,savingProfile=false;
const clean=e;
const attr=e;
// Add just one PROFILE entry to the category menu after INFORMATION.
if(!TYPES.some(row=>row[0]==='PROFILE'))TYPES.splice(1,0,['PROFILE','♙']);
function artistView(){
 const o=artistRecord();
 const fields=o?.profileFields||[];
 return `<div class="heading"><h1>PROFILE</h1><button class="button" type="button" onclick="artistProfileEdit()">${o?'編集':'＋ 登録'}</button></div>`+
 (o?`<section class="artist-profile-view tile">${o.images?.[0]?`<img class="artist-profile-hero" src="${attr(o.images[0])}" alt="プロフィール写真">`:''}<div class="artist-profile-name"><span class="meta">ARTIST PROFILE</span><h2>${clean(o.title||'名前未登録')}</h2></div><div class="artist-profile-facts">${fields.filter(f=>f.label&&f.value).map(f=>`<div class="artist-profile-fact"><span>${clean(f.label)}</span><strong>${clean(f.value)}</strong></div>`).join('')||'<div class="home-empty">プロフィール項目はまだありません</div>'}</div></section>`:
 `<section class="tile artist-profile-empty"><p>アーティストのプロフィールはまだ登録されていません。</p><button class="button" type="button" onclick="artistProfileEdit()">プロフィールを登録</button></section>`);
}
// HOME reuses the existing profile detail layout, rather than a new summary card.
window.artistProfileHomeMarkup=function(){
 const o=artistRecord();
 const fields=o?.profileFields||[];
 return `<div class="heading artist-profile-home-heading"><h1>PROFILE</h1><button class="button" type="button" onclick="artistProfileEdit()">${o?'編集':'＋ 登録'}</button></div>`+
 (o?`<div class="artist-profile-view">${o.images?.[0]?`<img class="artist-profile-hero" src="${attr(o.images[0])}" alt="プロフィール写真">`:''}<div class="artist-profile-name"><span class="meta">ARTIST PROFILE</span><h2>${clean(o.title||'名前未登録')}</h2></div><div class="artist-profile-facts">${fields.filter(f=>f.label&&f.value).map(f=>`<div class="artist-profile-fact"><span>${clean(f.label)}</span><strong>${clean(f.value)}</strong></div>`).join('')||'<div class="home-empty">プロフィール項目はまだありません</div>'}</div></div>`:
 `<div class="artist-profile-empty"><p>アーティストのプロフィールはまだ登録されていません。</p><button class="button" type="button" onclick="artistProfileEdit()">プロフィールを登録</button></div>`);
};
// The old PROFILE route now locates the corresponding section on HOME.
const originalGoArtist=go;
go=function(destination){
 if(destination==='PROFILE'){
   originalGoArtist('HOME');
   requestAnimationFrame(()=>document.getElementById('homeArtistProfile')?.scrollIntoView({block:'start'}));
   return;
 }
 return originalGoArtist(destination);
};
const originalRender=render;
render=function(){if(page==='PROFILE'&&!selected){originalRender();$('#app').innerHTML=artistView();return}return originalRender()};
function gatherFields(){
 const rows=document.querySelectorAll('#artistProfileFields .artist-profile-field-row');
 if(!rows.length)return;
 fieldDraft=Array.from(rows).map(row=>({id:row.dataset.id,label:row.querySelector('.artist-field-label')?.value||'',value:row.querySelector('.artist-field-value')?.value||''}));
}
function drawFields(){
 const el=$('#artistProfileFields');if(!el)return;
 el.innerHTML=fieldDraft.map((f,i)=>`<div class="artist-profile-field-row" data-id="${attr(f.id)}"><div class="artist-profile-field-inputs"><label class="field">項目名<input class="artist-field-label" value="${attr(f.label)}" placeholder="例：好きな食べ物"></label><label class="field">内容<input class="artist-field-value" value="${attr(f.value)}" placeholder="内容を入力"></label></div><div class="artist-profile-field-actions"><button type="button" class="button secondary" onclick="artistProfileMove(${i},-1)" ${i===0?'disabled':''}>↑ 上へ</button><button type="button" class="button secondary" onclick="artistProfileMove(${i},1)" ${i===fieldDraft.length-1?'disabled':''}>↓ 下へ</button><button type="button" class="button danger" onclick="artistProfileRemove(${i})">削除</button></div></div>`).join('')||'<p class="muted">項目がありません。「＋ 項目を追加」で登録できます。</p>';
}
function drawPhoto(){const el=$('#artistProfilePhotoPreview');if(el)el.innerHTML=photoDraft?`<img src="${attr(photoDraft)}" alt="メイン写真のプレビュー"><button type="button" class="button secondary" onclick="artistProfileRemovePhoto()">写真を取り除く</button>`:'<p class="muted">メイン写真はまだ登録されていません</p>'}
window.artistProfileEdit=function(){
 const o=artistRecord();editingProfile=true;savingProfile=false;
 fieldDraft=(o?.profileFields?o.profileFields.map(f=>({...f,id:f.id||uuid()})):defaults.map(label=>({id:uuid(),label,value:''})));
 photoDraft=o?.images?.[0]||'';
 $('#modal').innerHTML=`<div class="overlay"><div class="inner"><div class="heading"><h1>PROFILE 編集</h1><button type="button" class="icon" onclick="artistProfileCancel()">✕</button></div><form id="artistProfileForm" onsubmit="artistProfileSave(event)"><label class="field">アーティスト名<input name="artistName" required value="${attr(o?.title||'')}" placeholder="アーティスト名"></label><label class="field">メイン写真（1枚のみ）<input type="file" id="artistProfileFile" accept="image/*" onchange="artistProfileChoosePhoto(this)"></label><div id="artistProfilePhotoPreview" class="artist-profile-photo-preview"></div><h3>基本情報</h3><p class="muted">項目名と内容を自由に編集できます。↑↓で順番を変更できます。</p><div id="artistProfileFields"></div><button class="button secondary" type="button" onclick="artistProfileAdd()">＋ 項目を追加</button><div class="actions"><button class="button" id="artistProfileSaveButton" type="submit">保存する</button><button class="button secondary" type="button" onclick="artistProfileCancel()">キャンセル</button></div></form></div></div>`;
 drawFields();drawPhoto();
};
window.artistProfileAdd=function(){gatherFields();fieldDraft.push({id:uuid(),label:'',value:''});drawFields()};
window.artistProfileMove=function(i,step){gatherFields();const j=i+step;if(j<0||j>=fieldDraft.length)return;[fieldDraft[i],fieldDraft[j]]=[fieldDraft[j],fieldDraft[i]];drawFields()};
window.artistProfileRemove=function(i){gatherFields();fieldDraft.splice(i,1);drawFields()};
window.artistProfileChoosePhoto=async function(input){const file=input.files?.[0];if(!file)return;try{photoDraft=await readFile(file);drawPhoto()}catch(err){alert('写真を読み込めませんでした: '+(err.message||err))}finally{input.value=''}};
window.artistProfileRemovePhoto=function(){photoDraft='';drawPhoto()};
window.artistProfileCancel=function(){if(!editingProfile)return; if(!confirm('保存していない変更がある場合は破棄されます。編集を閉じますか？'))return;editingProfile=false;dismissOverlay()};
window.artistProfileSave=async function(event){
 event.preventDefault();if(savingProfile)return;gatherFields();
 const name=$('#artistProfileForm [name="artistName"]')?.value.trim();if(!name){alert('アーティスト名を入力してください');return}
 const invalid=fieldDraft.find(f=>(f.label.trim()&&!f.value.trim())||(!f.label.trim()&&f.value.trim()));
 if(invalid){alert('項目名と内容は両方入力するか、不要な行を削除してください。');return}
 const existing=artistRecord();const o={...(existing||{}),id:existing?.id||PROFILE_ID,type:'PROFILE',title:name,images:photoDraft?[photoDraft]:[],profileFields:fieldDraft.filter(f=>f.label.trim()).map(f=>({id:f.id,label:f.label.trim(),value:f.value.trim()})),when:existing?.when||today(),replies:existing?.replies||[],fav:existing?.fav||false};
 const btn=$('#artistProfileSaveButton');savingProfile=true;if(btn)btn.disabled=true;
 try{await put(o);editingProfile=false;dismissOverlay();await update()}catch(err){alert('プロフィールを保存できませんでした: '+(err.message||err))}finally{savingProfile=false;if(btn?.isConnected)btn.disabled=false}
};
})();

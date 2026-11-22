/* Fanclub Memo: navigation history, FEED image reactions, THREAD guest authors.
   Additive patch. Existing IndexedDB records and other categories are unchanged. */
(function () {
'use strict';
const esc = e;
const FEED_REACTIONS = 35;
const reactionKey = i => 'art-' + i;
// Short counts are presentation-only; stored counts remain exact.
const formatReactionCount = value => {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  if (n < 1000) return String(n);
  if (n < 1000000) return (Math.floor(n / 100) / 10).toFixed(1) + 'K';
  return (Math.floor(n / 100000) / 10).toFixed(1) + 'M';
};
// Sample without replacement. Called when creating a new FEED post
// or when the user explicitly presses the shuffle button.
const makeRandomFeedReactions = () => {
  const ids = Array.from({length:FEED_REACTIONS}, (_,i)=>i);
  for (let i=ids.length-1; i>0; i--) {
    const j=Math.floor(Math.random()*(i+1));
    [ids[i],ids[j]]=[ids[j],ids[i]];
  }
  const count=6+Math.floor(Math.random()*2);
  return ids.slice(0,count).map(i=>({
    id:reactionKey(i),
    count:1000+Math.floor(Math.random()*19001)
  }));
};
const reactionIcon = (r, cls='reaction-icon') => {
  if (r.image) return `<img class="${cls}" src="${esc(r.image)}" alt="リアクション">`;
  const n = Number(String(r.id||'').replace('art-',''));
  if(!Number.isInteger(n)||n<0||n>=FEED_REACTIONS)return `<span class="${cls}">♡</span>`;
  return `<span class="${cls} reaction-sprite" style="background-position:${(n%5)*25}% ${Math.floor(n/5)*(100/6)}%" aria-label="リアクション${n+1}"></span>`;
};
const reactionSummary = o => {
  const a=Array.isArray(o.feedReactions)?o.feedReactions:[];
  return `<div class="feed-reaction-summary">${a.map(r=>`<span class="feed-reaction-chip">${reactionIcon(r)}<span>${formatReactionCount(r.count)}</span></span>`).join('')}${!a.length?'<span class="meta">リアクションなし</span>':''}</div>`;
};
const poster = (o, thread=false) => {
  const guest=thread?!!o.threadGuest?.enabled:!!o.feedGuest?.enabled;
  const guestData=thread?o.threadGuest:o.feedGuest;
  const name=guest?(guestData.name||o.artist||'MEMBER'):(o.artist||'投稿者未設定');
  const icon=guest?(guestData.image?`<img class="avatar" src="${esc(guestData.image)}" alt="">`:`<span class="avatar avatar-fallback">${esc(name.slice(0,1))}</span>`):avatar(name);
  const label=guest?'<span class="pill role-member">MEMBER</span>':roleBadge(name);
  return `<div class="row">${icon}<div class="post-identity"><div class="post-identity-name"><strong>${esc(name)}</strong> ${label}</div><div class="meta">${day(o.when)}</div></div></div>`;
};
threadCard=function(o){return `<article class="card" onclick="detail('${o.id}')">${poster(o,true)}<p>${esc(o.body||o.title)}</p>${o.images?.[0]?pic(o,'banner'):''}<div class="meta">返信 ${(o.replies||[]).length}件</div></article>`};
feedCard=function(o){return `<article class="card" onclick="detail('${o.id}')">${poster(o)}<p>${esc(o.body||o.title)}</p>${o.images?.length?`<div class="photos">${o.images.map(src=>`<img src="${src}" alt="投稿写真">`).join('')}</div>`:''}${reactionSummary(o)}</article>`};
const previousDetail=showDetail;
showDetail=function(o){
 if(o.type==='FEED')return `<button class="button secondary" onclick="back()">‹ 戻る</button><div class="meta" style="margin-top:12px">FEED</div><div class="card">${poster(o)}<p>${esc(o.body||o.title)}</p>${(o.images||[]).length?`<div class="photos">${o.images.map((src,i)=>`<img src="${src}" alt="投稿写真" onclick="viewer('${o.id}',${i})">`).join('')}</div>`:''}${reactionSummary(o)}</div><h3>返信 ${(o.replies||[]).length}件</h3><div class="feed-replies">${(o.replies||[]).map(r=>`<div class="reply feed-reply-card"><div class="row">${r.image?`<img class="avatar" src="${esc(r.image)}" alt="">`:`<span class="avatar avatar-fallback">${esc(String(r.author||'ファン').slice(0,1))}</span>`}<div><strong>${esc(r.author||'ファン')}</strong> <span class="pill role-member">MEMBER</span><div class="meta">${day(r.when)}</div></div></div><p>${esc(r.text||'')}</p></div>`).join('')}</div><section class="feed-reply-editor"><h3>ファンからの返信を追加</h3><label class="field">ファン名<input id="feedReplyName" placeholder="例：sakura_25" autocomplete="off"></label><label class="field">返信<textarea id="reply" placeholder="返信の内容"></textarea></label><label class="field">プロフィール写真（任意）<input id="feedReplyImage" type="file" accept="image/*"></label><p class="muted">返信ごとにファン名を設定できます。ラベルはMEMBER固定です。</p><button class="button" type="button" onclick="addReply('${o.id}')">返信を保存</button></section>${postActions(o)}`;
 if(o.type==='THREAD')return `<button class="button secondary" onclick="back()">‹ 戻る</button><div class="meta" style="margin-top:12px">THREAD</div><div class="card">${poster(o,true)}<p>${esc(o.body||o.title)}</p>${(o.images||[]).length?`<div class="photos">${o.images.map((src,i)=>`<img src="${src}" onclick="viewer('${o.id}',${i})" alt="投稿写真">`).join('')}</div>`:''}</div><h3>返信 ${(o.replies||[]).length}件</h3>${(o.replies||[]).map(r=>`<div class="reply"><div class="meta">${esc(r.author)} · ${day(r.when)}</div>${esc(r.text)}</div>`).join('')}<label class="field">返信<textarea id="reply" placeholder="返信を書く"></textarea></label><button class="button" onclick="addReply('${o.id}')">返信を保存</button>${postActions(o)}`;
 return previousDetail(o);
};
function postActions(o){return `<div class="actions"><button class="button secondary" onclick="favorite('${o.id}')">${o.fav?'♥ 登録済み':'♡ お気に入り'}</button><button class="button secondary" onclick="editor('${o.id}')">編集</button><button class="button danger" onclick="removeItem('${o.id}')">削除</button></div>`}
let feedDraft=[],feedEditingId=null,guestDraftImage='',threadGuestMode='registered';
const oldEditor=editor;
editor=function(id){
 const item=id?data.find(x=>x.id===id):null,type=item?.type||page;
 if(type==='FEED'){
   feedEditingId=id||null;
   feedDraft=item ? (item.feedReactions||[]).map(r=>({...r})) : makeRandomFeedReactions();
   oldEditor(id);
   const form=document.getElementById('editform');if(!form)return;
   const area=document.createElement('section');area.className='reaction-edit-area';
   area.innerHTML=`<h3>画像リアクション</h3><p class="muted">新規投稿は6〜7種類・各1.0K〜20.0Kを自動設定します。手動で種類・件数を変更できます。ランダム生成を押すと現在のリアクション設定が置き換わります。</p><div id="feedReactionRows"></div><div class="actions"><button class="button secondary" type="button" onclick="feedReactionPicker()">＋ リアクションを選ぶ</button><button class="button secondary" type="button" onclick="feedRandomizeReactions()">↻ ランダム生成</button></div>`;
   form.querySelector('.actions')?.before(area);drawFeedReactionRows();
   threadGuestMode=item?.feedGuest?.enabled?'guest':'registered';guestDraftImage=item?.feedGuest?.image||'';
   const authorArea=document.createElement('section');authorArea.className='thread-guest-editor';
   authorArea.innerHTML=`<h3>投稿者</h3><div class="thread-mode-choices"><label><input type="radio" name="feedAuthorMode" value="registered" ${threadGuestMode==='registered'?'checked':''} onchange="threadToggleAuthor(this.value)"> 登録済みARTIST／STAFF</label><label><input type="radio" name="feedAuthorMode" value="guest" ${threadGuestMode==='guest'?'checked':''} onchange="threadToggleAuthor(this.value)"> 投稿ごとにファン名を設定</label></div><div id="threadGuestFields"><label class="field">ファン名<input id="threadGuestName" value="${esc(item?.feedGuest?.name||'')}" placeholder="好きなファン名"></label><label class="field">プロフィール写真（任意）<input id="threadGuestFile" type="file" accept="image/*" onchange="threadGuestPreview(this)"></label><div id="threadGuestPreview">${guestDraftImage?`<img class="avatar" src="${esc(guestDraftImage)}" alt="プロフィール写真">`:''}</div><button type="button" class="button secondary" onclick="threadGuestClearPhoto()">写真を外す</button><p class="muted">この投稿だけのファン名・写真です。ラベルはMEMBER固定、アカウント一覧には追加しません。</p></div>`;
   form.querySelector('[name="artist"]')?.closest('label')?.before(authorArea);
   threadToggleAuthor(threadGuestMode);
 }else if(type==='THREAD'){
   threadGuestMode=item?.threadGuest?.enabled?'guest':'registered';guestDraftImage=item?.threadGuest?.image||'';
   oldEditor(id);
   const form=document.getElementById('editform');if(!form)return;
   const area=document.createElement('section');area.className='thread-guest-editor';
   area.innerHTML=`<h3>投稿者</h3><div class="thread-mode-choices"><label><input type="radio" name="threadAuthorMode" value="registered" ${threadGuestMode==='registered'?'checked':''} onchange="threadToggleAuthor(this.value)"> 登録済みアカウント</label><label><input type="radio" name="threadAuthorMode" value="guest" ${threadGuestMode==='guest'?'checked':''} onchange="threadToggleAuthor(this.value)"> 投稿ごとにファン名を設定</label></div><div id="threadGuestFields"><label class="field">表示名<input id="threadGuestName" value="${esc(item?.threadGuest?.name||'')}" placeholder="好きなファン名"></label><label class="field">プロフィール写真（任意）<input id="threadGuestFile" type="file" accept="image/*" onchange="threadGuestPreview(this)"></label><div id="threadGuestPreview">${guestDraftImage?`<img class="avatar" src="${esc(guestDraftImage)}" alt="プロフィール写真">`:''}</div><button type="button" class="button secondary" onclick="threadGuestClearPhoto()">写真を外す</button><p class="muted">この投稿だけの表示名・写真です。ラベルはMEMBER固定で投稿者管理には追加しません。</p></div>`;
   form.querySelector('[name="artist"]')?.closest('label')?.before(area);
   threadToggleAuthor(threadGuestMode);
 }
};
window.threadToggleAuthor=function(mode){threadGuestMode=mode;const box=document.getElementById('threadGuestFields');if(box)box.hidden=mode!=='guest';const select=document.querySelector('#editform [name="artist"]');if(select){const label=select.closest('label');if(label)label.style.display=mode==='guest'?'none':'';}};
window.threadGuestPreview=async function(el){if(el.files?.[0]){try{guestDraftImage=await readFile(el.files[0]);document.getElementById('threadGuestPreview').innerHTML=`<img class="avatar" src="${esc(guestDraftImage)}" alt="プレビュー">`;}catch(err){alert('画像を読み込めませんでした: '+err.message)}}};
window.threadGuestClearPhoto=function(){guestDraftImage='';const el=document.getElementById('threadGuestPreview');if(el)el.innerHTML='';const input=document.getElementById('threadGuestFile');if(input)input.value=''};
window.drawFeedReactionRows=function(){const slot=document.getElementById('feedReactionRows');if(!slot)return;slot.innerHTML=feedDraft.map((r,i)=>`<div class="feed-reaction-edit-row">${reactionIcon(r)}<label>件数<input type="number" inputmode="numeric" min="0" step="1" value="${Number(r.count)||0}" onchange="feedCountChange(${i},this.value)"></label><button type="button" class="button danger" onclick="feedRemoveReaction(${i})">削除</button></div>`).join('')||'<p class="muted">選択されたリアクションはありません。</p>'};
window.feedRandomizeReactions=function(){
  if(feedDraft.length&&!confirm('現在のリアクションの種類と件数をランダムな内容に置き換えますか？'))return;
  feedDraft=makeRandomFeedReactions();
  drawFeedReactionRows();
};
window.feedCountChange=(i,v)=>{feedDraft[i].count=Math.max(0,Math.floor(Number(v)||0))};
window.feedRemoveReaction=i=>{feedDraft.splice(i,1);drawFeedReactionRows()};
window.feedReactionPicker=function(){
 const modal=document.getElementById('feedReactionPicker');if(modal)modal.remove();
 const box=document.createElement('div');box.id='feedReactionPicker';box.className='reaction-picker-shade';
 box.innerHTML=`<div class="reaction-picker-panel" role="dialog" aria-label="リアクション選択"><div class="row" style="justify-content:space-between"><strong>リアクションを選択</strong><button class="button secondary" type="button" onclick="feedClosePicker()">閉じる</button></div><p class="muted">イラストをタップすると追加できます。</p><div class="reaction-picker-grid">${Array.from({length:FEED_REACTIONS},(_,i)=>`<button class="reaction-picker-option" type="button" onclick="feedAddReaction(${i})" aria-label="リアクション${i+1}">${reactionIcon({id:reactionKey(i)})}</button>`).join('')}</div><label class="field">ほかの画像を追加<input type="file" accept="image/*" onchange="feedAddCustomReaction(this)"></label></div>`;
 document.body.appendChild(box);
};
window.feedClosePicker=()=>document.getElementById('feedReactionPicker')?.remove();
window.feedAddReaction=function(n){const id=reactionKey(n);if(!feedDraft.some(r=>r.id===id))feedDraft.push({id,count:0});drawFeedReactionRows();feedClosePicker()};
window.feedAddCustomReaction=async function(el){const f=el.files?.[0];if(!f)return;try{feedDraft.push({id:'custom-'+uuid(),image:await readFile(f),count:0});drawFeedReactionRows();feedClosePicker()}catch(err){alert('画像を読み込めませんでした: '+err.message)}};
const oldSave=save;
save=async function(ev){
 const item=editing?data.find(x=>x.id===editing):null;const type=item?.type||page;
 if(type!=='FEED'&&type!=='THREAD'){const oldScreen=snapshot();persistScroll();await oldSave(ev);recordTransition(oldScreen);return;}
 ev.preventDefault();document.activeElement?.blur?.();
 const form=ev.target,d=new FormData(form),isNew=!editing;
 if(type==='FEED'&&threadGuestMode!=='guest'&&!d.get('artist'))return alert('投稿者を選択してください。');
 const mode=threadGuestMode;
 const guestName=mode==='guest'?document.getElementById('threadGuestName')?.value.trim():'';
 if(mode==='guest'&&!guestName)return alert('ファンの表示名を入力してください。');
 const button=form.querySelector('button[type="submit"]');if(button)button.disabled=true;
 try{
   const o=isNew?{id:uuid(),type,images:[],replies:[],fav:false}:{...item};
   o.title='';o.category=String(d.get('category')||'');o.artist=mode==='guest'?guestName:String(d.get('artist')||'');o.when=String(d.get('when')||today());o.body=String(d.get('body')||'');
   const gone=[...form.querySelectorAll('.removePhoto:checked')].map(x=>Number(x.value));
   o.images=(o.images||[]).filter((_,i)=>!gone.includes(i));
   for(const f of (form.querySelector('#photos')?.files||[]))o.images.push(await readFile(f));
   if(type==='FEED'){o.feedReactions=feedDraft.map(r=>({...r,count:Math.max(0,Math.floor(Number(r.count)||0))}));o.feedGuest=mode==='guest'?{enabled:true,name:guestName,image:guestDraftImage}:{enabled:false};}
   if(type==='THREAD')o.threadGuest=mode==='guest'?{enabled:true,name:guestName,image:guestDraftImage}:{enabled:false};
   const beforeSave=snapshot();persistScroll();
   await put(o);dismissOverlay();selected=o.id;page=type;await update();window.scrollTo(0,0);
   recordTransition(beforeSave);
 }catch(err){alert('保存できませんでした: '+(err.message||err));if(button)button.disabled=false}
};

// View-history navigation. The current screen and scroll position are stored in the browser history.
const HISTORY_FLAG='__fcMemoNavigationV1';
let navigationReady=false, navigationRestoring=false, navigationDepth=0;
function snapshot(){return {page,selected,category,order,search,channelTab:typeof channelTab==='string'?channelTab:'home',channelSelected:typeof channelSelected==='string'?channelSelected:null,scrollY:Math.max(0,window.scrollY||0)}}
function currentEntry(){return history.state&&history.state[HISTORY_FLAG]?history.state:null}
function persistScroll(){const state=currentEntry();if(!state||navigationRestoring)return;history.replaceState({...state,snapshot:{...state.snapshot,scrollY:Math.max(0,window.scrollY||0)}},'')}
function recordTransition(before){const after=snapshot();if(before.page===after.page&&before.selected===after.selected&&before.channelTab===after.channelTab&&before.channelSelected===after.channelSelected)return;navigationDepth++;history.pushState({[HISTORY_FLAG]:true,depth:navigationDepth,snapshot:after},'')}
function navigate(fn){if(navigationRestoring)return fn();persistScroll();const before=snapshot();const result=fn();const after=snapshot();if(before.page===after.page&&before.selected===after.selected&&before.channelTab===after.channelTab&&before.channelSelected===after.channelSelected)return result;recordTransition(before);return result}
function restoreScreen(s){
 navigationRestoring=true;
 page=s.page;selected=s.selected;category=s.category;order=s.order;search=s.search;
 if(typeof channelTab!=='undefined')channelTab=s.channelTab;
 if(typeof channelSelected!=='undefined')channelSelected=s.channelSelected;
 dismissOverlay();drawer(false);render();
 let attempt=0;const restore=()=>{window.scrollTo(0,s.scrollY||0);if(++attempt<6)setTimeout(restore,120)};
 requestAnimationFrame(()=>requestAnimationFrame(restore));setTimeout(()=>{navigationRestoring=false},850);
}
const oldGo=go,oldDetail=detail,oldSearchPage=searchPage;
go=function(p){return navigate(()=>oldGo(p))};
detail=function(id){return navigate(()=>oldDetail(id))};
searchPage=function(){return navigate(()=>oldSearchPage())};
if(typeof channelOpen==='function'){const fn=channelOpen;channelOpen=function(id){return navigate(()=>fn(id))}}
if(typeof chNavTab==='function'){const fn=chNavTab;chNavTab=function(tab){return navigate(()=>fn(tab))}}
const originalBack=back;
back=function(){const st=currentEntry();if(st&&st.depth>0){persistScroll();history.back()}else originalBack()};
if(typeof chBack==='function'){const fn=chBack;chBack=function(){const st=currentEntry();if(st&&st.depth>0){persistScroll();history.back()}else fn()}}
function initializeHistory(){if(navigationReady)return;navigationReady=true;history.scrollRestoration='manual';history.replaceState({[HISTORY_FLAG]:true,depth:0,snapshot:snapshot()},'')}
initializeHistory();
for(const name of ['infoSave','wardrobeSave','saveSpecial','greetingSave','saveChannelEntry']){
  const original=window[name];if(typeof original!=='function')continue;
  window[name]=async function(...args){const before=snapshot();persistScroll();await original.apply(this,args);recordTransition(before)};
}
window.addEventListener('popstate',ev=>{if(ev.state?.[HISTORY_FLAG]){navigationDepth=ev.state.depth;restoreScreen(ev.state.snapshot)}});
let scrollPending=false;
window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(()=>{scrollPending=false;persistScroll()})}},{passive:true});
// Native Safari back gesture is used in browser tabs. Provide equivalent edge swipe in standalone PWA.
let touchStart=null;
const standalone=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
if(standalone){
 document.addEventListener('touchstart',ev=>{if(ev.touches.length!==1)return;const t=ev.touches[0];if(t.clientX>28||ev.target.closest('.viewer,.wardrobe-pages,.photos,.gallery-masonry,.overlay,.reaction-picker-shade,.ch-shorts'))return;touchStart={x:t.clientX,y:t.clientY,time:Date.now()};},{passive:true});
 document.addEventListener('touchend',ev=>{if(!touchStart)return;const t=ev.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(dx>85&&Math.abs(dy)<70&&currentEntry()?.depth>0)back();},{passive:true});
}
})();

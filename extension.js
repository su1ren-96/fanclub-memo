/* Fanclub Memo v6: independent channel and SPECIAL article builder */
const _baseRender = render;
function renderFiveTabBar(){
 const nav = document.getElementById('nav');
 if(!nav)return;
 const tabs=[['HOME','⌂'],['FAVORITES','♡'],['CHANNEL','▶'],['MY PAGE','♙'],['SETTINGS','⚙']];
 nav.innerHTML=tabs.map(([p,i])=>`<button class="${page===p?'active':''}" onclick="${p==='CHANNEL'?'channelTabPress()':`go('${p}')`}"><span>${i}</span>${p}</button>`).join('');
}
render = function(){
 document.body.classList.toggle('channel-mode',page==='CHANNEL');
 if(page==='CHANNEL') {renderChannel();renderFiveTabBar();return;}
 _baseRender();
 renderFiveTabBar();
};
const _baseEditor = editor;
editor = function(recordId){
 const r=recordId?data.find(x=>x.id===recordId):null;
 if((r?.type||page)==='SPECIAL')return specialEditor(recordId);
 return _baseEditor(recordId);
};
const _baseShowDetail = showDetail;
showDetail = function(o){
 if(o.type==='SPECIAL')return specialArticle(o);
 return _baseShowDetail(o);
};

/* SPECIAL template-specific structured authoring */
let specialDraft=null, specialEditing=null;
const SPECIAL_NAMES={event:'イベント特集',interview:'インタビュー・記事',photo:'フォト特集'};
function newSpecialSection(kind){return {kind,heading:'',text:'',question:'',answer:'',image:''}}
function initialSpecialSections(kind){return kind==='interview'?[newSpecialSection('qa')]:kind==='photo'?[newSpecialSection('photo')]:[newSpecialSection('text')];}
function specialEditor(id){
 let o=id?data.find(x=>x.id===id):null;specialEditing=id||null;
 let template=o?.template||'event';
 let secs=Array.isArray(o?.sections)&&o.sections.length?o.sections.map(s=>({kind:s.kind||'text',heading:s.heading||'',text:s.text||'',question:s.question||'',answer:s.answer||'',image:s.image||''})):initialSpecialSections(template);
 if(o?.images?.length>1 && !secs.some(s=>s.kind==='photo'&&s.image)){
   secs.push(...o.images.slice(1).map(img=>({...newSpecialSection('photo'),image:img})));
 }
 specialDraft={title:o?.title||'',when:o?.when||today(),body:o?.body||'',template,hero:o?.images?.[0]||'',sections:secs};
 drawSpecialEditor();
}
function specialCapture(){
 if(!specialDraft)return;
 const q=s=>document.querySelector(s);
 specialDraft.title=q('#spTitle')?.value??specialDraft.title;
 specialDraft.when=q('#spWhen')?.value??specialDraft.when;
 specialDraft.body=q('#spIntro')?.value??specialDraft.body;
 specialDraft.sections.forEach((s,i)=>{
  const root=q(`[data-sp-section="${i}"]`);if(!root)return;
  ['heading','text','question','answer'].forEach(k=>{let el=root.querySelector(`[data-field="${k}"]`);if(el)s[k]=el.value});
 });
}
function specialTemplateChange(value){
 specialCapture();specialDraft.template=value;
 if(!specialDraft.sections.length)specialDraft.sections=initialSpecialSections(value);
 drawSpecialEditor();
}
function specialAdd(kind){specialCapture();specialDraft.sections.push(newSpecialSection(kind));drawSpecialEditor();document.getElementById('specialSectionsEnd')?.scrollIntoView({block:'nearest',behavior:'smooth'})}
function specialRemove(i){specialCapture();if(!confirm('このセクションを削除しますか？'))return;specialDraft.sections.splice(i,1);drawSpecialEditor()}
function specialMove(i,delta){specialCapture();let n=i+delta;if(n<0||n>=specialDraft.sections.length)return;[specialDraft.sections[i],specialDraft.sections[n]]=[specialDraft.sections[n],specialDraft.sections[i]];drawSpecialEditor()}
function specialKindOptions(k){return [['text','見出し＋本文'],['qa','質問＋回答'],['photo','写真＋キャプション']].map(([v,t])=>`<option value="${v}" ${k===v?'selected':''}>${t}</option>`).join('')}
function specialChangeKind(i,v){specialCapture();specialDraft.sections[i].kind=v;drawSpecialEditor()}
function specialBlockFields(s,i){
 if(s.kind==='qa')return `<label class="field">質問<input data-field="question" value="${e(s.question)}" placeholder="質問を入力"></label><label class="field">回答<textarea data-field="answer" placeholder="回答を入力">${e(s.answer)}</textarea></label>`;
 if(s.kind==='photo')return `<label class="field">写真${s.image?`<img class="sp-thumb" src="${s.image}" alt="写真">`:''}<input type="file" accept="image/*" data-image-index="${i}"></label><label class="field">写真の説明<input data-field="text" value="${e(s.text)}" placeholder="キャプション（任意）"></label>${s.image?`<label class="sp-check"><input type="checkbox" data-clear-image="${i}"> 登録した写真を削除</label>`:''}`;
 return `<label class="field">見出し<input data-field="heading" value="${e(s.heading)}" placeholder="セクション見出し"></label><label class="field">本文<textarea data-field="text" placeholder="本文を入力">${e(s.text)}</textarea></label>`;
}
function drawSpecialEditor(){
 const s=specialDraft;const types=s.template==='interview'?[['qa','＋ 質問と回答'],['text','＋ 見出し・本文'],['photo','＋ 写真']]:s.template==='photo'?[['photo','＋ 写真'],['text','＋ 文章'],['qa','＋ Q&A']]:[['text','＋ 見出し・本文'],['photo','＋ 写真'],['qa','＋ Q&A']];
 $('#modal').innerHTML=`<div class="overlay sp-editor"><div class="inner"><div class="heading"><h1>${specialEditing?'編集':'新規追加'} · SPECIAL</h1><button type="button" class="icon" onclick="specialCancel()">✕</button></div>
 <p class="muted">テンプレートごとに編集項目と特集ページのレイアウトが変わります。</p>
 <label class="field">特集テンプレート<select id="spTemplate" onchange="specialTemplateChange(this.value)">${Object.entries(SPECIAL_NAMES).map(([v,l])=>`<option value="${v}" ${s.template===v?'selected':''}>${l}</option>`).join('')}</select></label>
 <div class="sp-template-note"><strong>${SPECIAL_NAMES[s.template]}</strong><div>${s.template==='event'?'イベント情報・写真を織り交ぜた特設記事です':s.template==='interview'?'質問と回答を中心にしたインタビュー記事です':'写真を大きく見せるフォトストーリーです'}</div></div>
 <label class="field">タイトル<input id="spTitle" value="${e(s.title)}" placeholder="特集タイトル"></label>
 <label class="field">公開日時<input id="spWhen" type="datetime-local" value="${e(s.when)}"></label>
 <label class="field">ヒーロー画像（メイン画像）${s.hero?`<img class="sp-thumb hero-preview" src="${s.hero}" alt="ヒーロー画像">`:''}<input id="spHero" type="file" accept="image/*"></label>
 ${s.hero?'<label class="sp-check"><input id="spClearHero" type="checkbox"> ヒーロー画像を削除</label>':''}
 <label class="field">導入文<textarea id="spIntro" placeholder="特集の紹介文">${e(s.body)}</textarea></label>
 <h2 class="sp-section-title">${s.template==='interview'?'インタビューの内容':s.template==='photo'?'フォトセクション':'記事セクション'}</h2>
 ${s.sections.map((b,i)=>`<section class="sp-section" data-sp-section="${i}"><div class="sp-section-head"><strong>セクション ${i+1}</strong><div><button type="button" class="sp-mini" onclick="specialMove(${i},-1)" ${i===0?'disabled':''}>↑</button><button type="button" class="sp-mini" onclick="specialMove(${i},1)" ${i===s.sections.length-1?'disabled':''}>↓</button><button type="button" class="sp-mini sp-delete" onclick="specialRemove(${i})">削除</button></div></div>
 <label class="field">表示形式<select onchange="specialChangeKind(${i},this.value)">${specialKindOptions(b.kind)}</select></label>${specialBlockFields(b,i)}</section>`).join('')}
 <div id="specialSectionsEnd" class="sp-add-buttons">${types.map(([k,l])=>`<button type="button" class="button secondary" onclick="specialAdd('${k}')">${l}</button>`).join('')}</div>
 <div class="actions"><button class="button" onclick="saveSpecial()">保存する</button><button class="button secondary" onclick="specialCancel()">キャンセル</button></div></div></div>`;
}
function specialCancel(){specialCapture();if(!confirm('編集画面を閉じますか？保存していない変更は破棄されます。'))return;specialDraft=null;specialEditing=null;dismissOverlay()}
async function saveSpecial(){
 specialCapture();const s=specialDraft;if(!s?.title.trim())return alert('タイトルを入力してください');
 try{
  if($('#spClearHero')?.checked)s.hero='';let hero=$('#spHero')?.files?.[0];if(hero)s.hero=await readFile(hero);
  for(let i=0;i<s.sections.length;i++){
   if(document.querySelector(`[data-clear-image="${i}"]`)?.checked)s.sections[i].image='';
   let f=document.querySelector(`[data-image-index="${i}"]`)?.files?.[0];if(f)s.sections[i].image=await readFile(f);
  }
  const previous=specialEditing?data.find(x=>x.id===specialEditing):null;
  const o=previous?{...previous}:{id:uuid(),type:'SPECIAL',images:[],fav:false,replies:[]};
  o.title=s.title.trim();o.when=s.when;o.body=s.body;o.template=s.template;o.sections=s.sections.map(x=>({...x}));
  o.images=s.hero?[s.hero]:[];
  await put(o);specialDraft=null;specialEditing=null;dismissOverlay();page='SPECIAL';selected=o.id;await update();scrollTo(0,0);
 }catch(err){alert('SPECIALの保存に失敗しました: '+err.message)}
}
function specialArticle(o){
 let s=o.sections?.length?o.sections:[{kind:'text',heading:'',text:o.body||''}];
 let template=o.template||'event';let sections=s.map((x,i)=>{
  if(x.kind==='photo')return `<figure class="sp-article-photo">${x.image?`<img src="${x.image}" alt="写真 ${i+1}" onclick="specialPhotoView('${o.id}',${i})">`:''}${x.text?`<figcaption>${e(x.text)}</figcaption>`:''}</figure>`;
  if(x.kind==='qa')return `<section class="sp-article-qa"><div class="sp-question">Q. ${e(x.question||'質問')}</div><p>${e(x.answer||'')}</p></section>`;
  return `<section class="sp-article-text">${x.heading?`<h2>${e(x.heading)}</h2>`:''}<p>${e(x.text||'')}</p></section>`;
 }).join('');
 let hero=o.images?.[0];
 return `<button class="button secondary" onclick="back()">‹ 戻る</button><article class="special-v6 sp-${template}">${hero?`<img class="sp-article-hero" src="${hero}" alt="メイン画像">`:''}<div class="sp-article-head"><span class="sp-eyebrow">${template==='event'?'SPECIAL EVENT':template==='interview'?'SPECIAL INTERVIEW':'PHOTO SPECIAL'}</span><h1>${e(o.title)}</h1><div class="meta">${day(o.when)}</div></div>${o.body?`<p class="sp-article-intro">${e(o.body)}</p>`:''}<div class="sp-article-sections">${sections}</div></article><div class="actions"><button class="button secondary" onclick="editor('${o.id}')">編集</button><button class="button danger" onclick="removeItem('${o.id}')">削除</button></div>`;
}
function specialPhotoView(id,sectionIndex){let o=data.find(x=>x.id===id),src=o?.sections?.[sectionIndex]?.image;if(!src)return;$('#modal').innerHTML=`<div class="viewer"><img src="${src}" alt="写真"><button onclick="dismissOverlay()">✕</button></div>`}

/* Independently stored, YouTube-inspired CHANNEL */
let channelGenres=[],channelGenreExtras=[],channelDB=null,channelEntries=[],channelTab='home',channelSelected=null,channelSettings={name:'チャンネル名',handle:'@my-channel',description:'',subscribers:'',verified:false,banner:'',avatar:'',links:'',featured:''};
function chStore(mode='readonly'){return channelDB.transaction('entries',mode).objectStore('entries')}
function chAll(){return new Promise((resolve,reject)=>{let r=chStore().getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function chPut(v){return new Promise((resolve,reject)=>{let r=chStore('readwrite').put(v);r.onsuccess=resolve;r.onerror=()=>reject(r.error)})}
function chDel(v){return new Promise((resolve,reject)=>{let r=chStore('readwrite').delete(v);r.onsuccess=resolve;r.onerror=()=>reject(r.error)})}
async function channelRefresh(){
 if(!channelDB)return;
 let arr=await chAll();
 let settings=arr.find(x=>x.id==='settings');
 if(settings)channelSettings={...channelSettings,...settings};
 channelEntries=arr.filter(x=>x.id!=='settings'&&x.id!=='genre-settings');
 let saved=arr.find(x=>x.id==='genre-settings');
 // Discover categories in old uploads, without changing any video data.
 let discovered=[];
 for(const item of chSorted(channelEntries)){
  const name=channelGenre(item);
  if(!discovered.includes(name))discovered.push(name);
 }
 channelGenres=Array.isArray(saved?.names)?[...new Set(saved.names.filter(n=>typeof n==='string'&&n.trim()).map(n=>n.trim()))]:[];
 let changed=!saved;
 for(const name of discovered)if(!channelGenres.includes(name)){channelGenres.push(name);changed=true}
 // Keep new installations usable even if no videos have been saved yet.
 if(!channelGenres.length){channelGenres=['動画','ショート','ライブ','リリース'];changed=true}
 if(changed)await chPut({id:'genre-settings',names:channelGenres});
 if(page==='CHANNEL')render();
}
const chRequest=indexedDB.open('FanclubMemoChannelDB',1);
chRequest.onupgradeneeded=()=>{const d=chRequest.result;if(!d.objectStoreNames.contains('entries'))d.createObjectStore('entries',{keyPath:'id'})};
chRequest.onsuccess=()=>{channelDB=chRequest.result;channelRefresh()};
chRequest.onerror=()=>{if(page==='CHANNEL')document.getElementById('app').innerHTML='<div class="ch-empty">CHANNELの保存領域を開けませんでした。</div>'};
function chViews(n){
 if(n===null||n===undefined||String(n).trim()==='')return '';
 const v=Number(String(n).replace(/,/g,''));
 if(!Number.isFinite(v)||v<0)return '';
 const fmt=(x)=>Number.isInteger(x)?String(x):String(x.toFixed(1)).replace(/\.0$/,'');
 if(v>=100000000)return fmt(Math.floor(v/10000000)/10)+'億回視聴';
 if(v>=10000)return Math.floor(v/10000)+'万回視聴';
 return Math.floor(v).toLocaleString('ja-JP').replace(/,/g,'')+'回視聴';
}
function chViewMeta(o){return chViews(o.views)?'<span class="ch-views">'+chViews(o.views)+'</span> · ':''}
function chDate(s){return s?day(s):''}
function chSorted(arr){return [...arr].sort((a,b)=>new Date(b.when||0)-new Date(a.when||0))}
function chAvatar(){return channelSettings.avatar?`<img src="${channelSettings.avatar}" class="ch-avatar" alt="チャンネルアイコン">`:'<div class="ch-avatar ch-avatar-empty">▶</div>'}
function chNavTab(tab){channelTab=tab;channelSelected=null;render();document.getElementById('chTabs')?.scrollIntoView({block:'nearest'})}
function chBack(){channelSelected=null;render()}
function channelEntryCard(o){return `<article class="ch-video-card" onclick="channelOpen('${o.id}')">${o.image?`<img class="ch-video-cover" src="${o.image}" alt="サムネイル">`:'<div class="ch-video-cover ch-blank">▶</div>'}<div class="ch-video-info">${chAvatar()}<div class="ch-video-text"><strong>${e(o.title||'無題')}</strong><div>${e(channelSettings.name)}</div><div>${chViewMeta(o)}${chDate(o.when)}</div></div><button type="button" class="ch-more ch-menu-trigger" aria-label="動画の操作" onclick="chToggleMenu(event,'${o.id}')">⋮</button></div></article>`}
function channelOpen(id){channelSelected=id;render();scrollTo(0,0)}
function channelProfile(){
 const c=channelSettings;return `<div class="ch-channel-top"><div class="ch-banner">${c.banner?`<img src="${c.banner}" alt="チャンネルバナー">`:'<div class="ch-banner-placeholder">CHANNEL BANNER</div>'}</div><div class="ch-profile">${chAvatar()}<div class="ch-profile-copy"><h1>${e(c.name||'チャンネル名')} ${c.verified?'<span class="ch-verify">✓</span>':''}</h1><div class="ch-handle">${e(c.handle||'@my-channel')}</div><div class="ch-stats">チャンネル登録者数 ${e(c.subscribers||'—')} · ${channelEntries.length} 本の動画</div></div></div>${c.description?`<div class="ch-description">${e(c.description)}</div>`:''}${c.links?`<div class="ch-links">${e(c.links)}</div>`:''}<button class="ch-setup-btn" onclick="channelSettingsEditor()">チャンネルを編集</button></div>`;
}
function renderChannel(){
 let app=$('#app'),nav=$('#nav');
 nav.innerHTML=[['HOME','⌂'],['FAVORITES','♡'],['CHANNEL','▶'],['MY PAGE','♙'],['SETTINGS','⚙']].map(([p,i])=>`<button class="${page===p?'active':''}" onclick="${p==='CHANNEL'?'channelTabPress()':`go('${p}')`}"><span>${i}</span>${p}</button>`).join('');
 if(!channelDB){app.innerHTML='<div class="ch-empty">CHANNELを読み込んでいます…</div>';return}
 if(channelSelected){let o=channelEntries.find(x=>x.id===channelSelected);app.innerHTML=o?`<div class="ch-detail"><button class="ch-text-btn" onclick="chBack()">‹ 戻る</button>${o.image?`<img class="ch-detail-image" src="${o.image}" alt="サムネイル">`:'<div class="ch-detail-image ch-blank">▶</div>'}<h1>${e(o.title)}</h1><div class="ch-subline">${e(channelSettings.name)} · ${chViewMeta(o)}${chDate(o.when)} · ${e(chLabel(o.kind))}</div><div class="ch-description">${e(o.description||'')}</div><div class="ch-buttons"><button onclick="channelEntryEditor('${o.id}')">編集</button><button onclick="channelRemove('${o.id}')">削除</button></div></div>`:'<div class="ch-empty">コンテンツが見つかりません。</div>';return}
 let tabs=[['home','ホーム'],['video','動画'],['short','ショート'],['live','ライブ'],['release','リリース']];
 let arr=channelTab==='home'?chSorted(channelEntries):chSorted(channelEntries.filter(x=>x.kind===channelTab));
 app.innerHTML=`<div class="ch-app">${channelProfile()}<div class="ch-tabs" id="chTabs">${tabs.map(([k,v])=>`<button class="${channelTab===k?'current':''}" onclick="chNavTab('${k}')">${v}</button>`).join('')}</div><div class="ch-content-head"><strong>${channelTab==='home'?'ジャンル別':tabs.find(x=>x[0]===channelTab)?.[1]||'動画'}</strong><div class="ch-head-actions">${channelTab==='home'?'<button onclick="channelGenreManager()">ジャンル管理</button>':''}<button onclick="channelEntryEditor()">＋ 追加</button></div></div>${channelTab==='home'?channelHomeShelves():arr.length?arr.map(channelEntryCard).join(''):'<div class="ch-empty">まだコンテンツがありません。<br>「＋ 追加」から登録できます。</div>'}</div>`;
}
function channelGenre(o){return (o.genre||'').trim()||(o.kind==='short'?'ショート':o.kind==='live'?'ライブ':o.kind==='release'?'リリース':'動画')}
function channelShelfVideo(o){return `<article class="ch-shelf-video" onclick="channelOpen('${o.id}')">${o.image?`<img class="ch-shelf-image" src="${o.image}" alt="">`:'<div class="ch-shelf-image ch-blank">▶</div>'}<div><strong>${e(o.title||'無題')}</strong><div class="ch-shelf-meta">${e(channelSettings.name)}</div><div class="ch-shelf-meta">${chViewMeta(o)}${chDate(o.when)}</div></div><button type="button" class="ch-shelf-menu ch-menu-trigger" aria-label="動画の操作" onclick="chToggleMenu(event,'${o.id}')">⋮</button></article>`}
function channelShortCard(o){return `<article class="ch-short-card" onclick="channelOpen('${o.id}')">${o.image?`<img src="${o.image}" alt="">`:'<div class="ch-short-blank ch-blank">▶</div>'}<strong>${e(o.title||'無題')}</strong><small>${chViewMeta(o)}${chDate(o.when)}</small></article>`}
function chToggleShelf(index){
 const more=document.getElementById('ch-shelf-more-'+index),button=document.getElementById('ch-shelf-toggle-'+index);
 if(!more||!button)return;
 more.hidden=!more.hidden;
 button.setAttribute('aria-expanded',String(!more.hidden));
 button.innerHTML=more.hidden?'⌄ すべて表示':'⌃ 折りたたむ';
}
function channelHomeShelves(){
 const all=chSorted(channelEntries);
 if(!all.length)return '<div class="ch-empty">まだコンテンツがありません。<br>「＋ 追加」から登録できます。</div>';
 const groups=new Map();
 for(const item of all){const genre=channelGenre(item);if(!groups.has(genre))groups.set(genre,[]);groups.get(genre).push(item)}
 // Genre-settings controls the section order, regardless of publish dates.
 const names=[...channelGenres.filter(n=>groups.has(n)),...groups.keys()].filter((n,i,a)=>a.indexOf(n)===i);
 return names.map((name,index)=>{
  const entries=groups.get(name),shorts=entries.every(o=>o.kind==='short');
  const content=list=>shorts?`<div class="ch-shorts">${list.map(channelShortCard).join('')}</div>`:list.map(channelShelfVideo).join('');
  return `<section class="ch-shelf"><div class="ch-shelf-title"><h2>${e(name)}</h2></div>${content(entries.slice(0,3))}${entries.length>3?`<div id="ch-shelf-more-${index}" hidden>${content(entries.slice(3))}</div><button type="button" id="ch-shelf-toggle-${index}" class="ch-shelf-expand" aria-expanded="false" onclick="chToggleShelf(${index})">⌄ すべて表示</button>`:''}</section>`;
 }).join('');
}
function channelGenreManager(){
 if(!channelDB)return;
 $('#modal').innerHTML=`<div class="overlay ch-overlay"><div class="inner"><div class="heading"><h1>ホームのジャンル管理</h1><button type="button" class="icon" onclick="channelDismiss()">✕</button></div><p class="muted">ここで設定した順番でジャンルを固定表示します。ジャンルを追加すると、投稿画面の選択肢にも反映されます。</p><div id="chGenreList"></div><form onsubmit="chAddGenre(event)"><label class="field">新しいジャンル名<input name="name" id="chNewGenre" maxlength="100" placeholder="例：Music Video" required></label><button type="submit" class="button">＋ ジャンルを追加</button></form><div class="actions"><button type="button" class="button secondary" onclick="channelDismiss()">完了して戻る</button></div></div></div>`;
 chGenreManagerList();
}
function chGenreManagerList(){
 const list=document.getElementById('chGenreList');if(!list)return;
 list.innerHTML=channelGenres.map((name,i)=>`<div class="ch-genre-row"><span class="ch-genre-order">${i+1}</span><span class="ch-genre-name">${e(name)}</span><button type="button" aria-label="上に移動" ${i===0?'disabled':''} onclick="chMoveGenre(${i},-1)">↑</button><button type="button" aria-label="下に移動" ${i===channelGenres.length-1?'disabled':''} onclick="chMoveGenre(${i},1)">↓</button><button type="button" aria-label="名前を変更" onclick="chRenameGenre(${i})">編集</button><button type="button" aria-label="ジャンルを削除" onclick="chDeleteGenre(${i})">削除</button></div>`).join('');
}
async function chSaveGenres(){await chPut({id:'genre-settings',names:[...channelGenres]})}
async function chMoveGenre(i,d){let j=i+d;if(j<0||j>=channelGenres.length)return;[channelGenres[i],channelGenres[j]]=[channelGenres[j],channelGenres[i]];await chSaveGenres();chGenreManagerList()}
async function chAddGenre(event){event.preventDefault();const input=document.getElementById('chNewGenre'),name=input.value.trim();if(!name)return;if(channelGenres.includes(name))return alert('同じ名前のジャンルが登録されています。');channelGenres.push(name);await chSaveGenres();input.value='';chGenreManagerList()}
async function chRenameGenre(i){const old=channelGenres[i],name=prompt('新しいジャンル名',old)?.trim();if(!name||name===old)return;if(channelGenres.includes(name))return alert('同じ名前のジャンルが登録されています。');try{
 // Reassign existing posts before updating the category registry.
 for(const item of channelEntries)if(channelGenre(item)===old){item.genre=name;await chPut(item)}
 channelGenres[i]=name;await chSaveGenres();chGenreManagerList();
}catch(err){alert('名前変更に失敗しました: '+err.message)}}
async function chDeleteGenre(i){const name=channelGenres[i];const count=channelEntries.filter(item=>channelGenre(item)===name).length;if(count)return alert(`「${name}」には${count}件の動画があります。先に各動画を別のジャンルへ変更してください。`);if(!confirm(`「${name}」を削除しますか？`))return;channelGenres.splice(i,1);await chSaveGenres();chGenreManagerList()}
function chLabel(kind){return {video:'動画',short:'ショート',live:'ライブ',release:'リリース'}[kind]||'動画'}
let chEditing=null;
function channelSettingsEditor(){let c=channelSettings;$('#modal').innerHTML=`<div class="overlay ch-overlay"><div class="inner"><div class="heading"><h1>チャンネル設定</h1><button class="icon" onclick="channelDismiss()">✕</button></div><form id="chSettingsForm" onsubmit="saveChannelSettings(event)"><label class="field">チャンネル名<input name="name" value="${e(c.name)}" required></label><label class="field">ハンドル名<input name="handle" value="${e(c.handle)}"></label><label class="field">登録者数（表示文字列）<input name="subscribers" value="${e(c.subscribers)}" placeholder="例：3.6万人"></label><label class="field">紹介文<textarea name="description">${e(c.description)}</textarea></label><label class="field">外部リンクの表示文字列<input name="links" value="${e(c.links)}" placeholder="例：公式サイト"></label><label class="field"><input type="checkbox" name="verified" ${c.verified?'checked':''} style="width:auto"> 認証バッジを表示</label><label class="field">横長のチャンネルバナー${c.banner?`<img class="ch-field-preview" src="${c.banner}" alt="現在のバナー">`:''}<input type="file" id="chBannerFile" accept="image/*"></label><label class="field">プロフィール画像${c.avatar?`<img class="ch-field-avatar" src="${c.avatar}" alt="現在のアイコン">`:''}<input type="file" id="chAvatarFile" accept="image/*"></label><div class="actions"><button class="button" type="submit">保存する</button><button type="button" class="button secondary" onclick="channelDismiss()">キャンセル</button></div></form></div></div>`}
async function saveChannelSettings(ev){ev.preventDefault();document.activeElement?.blur?.();let d=new FormData(ev.target);let s={...channelSettings,id:'settings'};for(let k of ['name','handle','subscribers','description','links'])s[k]=d.get(k)||'';s.verified=d.has('verified');try{if($('#chBannerFile').files[0])s.banner=await readFile($('#chBannerFile').files[0]);if($('#chAvatarFile').files[0])s.avatar=await readFile($('#chAvatarFile').files[0]);await chPut(s);channelDismiss();await channelRefresh()}catch(ex){alert('設定を保存できませんでした: '+ex.message)}}
function channelEntryEditor(id){let o=id?channelEntries.find(x=>x.id===id):null;chEditing=id||null;let kind=o?.kind||(['video','short','live','release'].includes(channelTab)?channelTab:'video');$('#modal').innerHTML=`<div class="overlay ch-overlay"><div class="inner"><div class="heading"><h1>${o?'コンテンツ編集':'新規追加'} · CHANNEL</h1><button class="icon" onclick="channelDismiss()">✕</button></div><form id="channelEntryForm" onsubmit="saveChannelEntry(event)"><label class="field">種類<select name="kind">${[['video','動画'],['short','ショート'],['live','ライブ'],['release','リリース']].map(([k,l])=>`<option value="${k}" ${kind===k?'selected':''}>${l}</option>`).join('')}</select></label><label class="field">ホームのジャンル<select name="genre" required>${[...new Set([...channelGenres,...(o?[channelGenre(o)]:[])])].map(name=>`<option value="${e(name)}" ${name===(o?channelGenre(o):(channelGenres[0]||'動画'))?'selected':''}>${e(name)}</option>`).join('')}</select><small>ジャンルはホームの「ジャンル管理」で追加・並び替えできます。</small></label><label class="field">タイトル<input name="title" value="${e(o?.title||'')}" required></label><label class="field">公開日時<input name="when" type="datetime-local" value="${e(o?.when||today())}"></label><label class="field">再生回数（任意）<input type="number" name="views" min="0" step="1" inputmode="numeric" placeholder="例：13260000" value="${e(o?.views??'')}"><small>入力した数値を「1326万回視聴」などに変換して表示します。未入力なら表示しません。</small></label><label class="field">説明文<textarea name="description">${e(o?.description||'')}</textarea></label><label class="field">サムネイル画像${o?.image?`<img class="ch-field-preview" src="${o.image}" alt="現在のサムネイル">`:''}<input type="file" id="chEntryImage" accept="image/*"></label><div class="actions"><button class="button" type="submit">保存する</button><button class="button secondary" type="button" onclick="channelDismiss()">キャンセル</button></div></form></div></div>`}
async function saveChannelEntry(ev){ev.preventDefault();document.activeElement?.blur?.();let d=new FormData(ev.target);let prev=chEditing?channelEntries.find(x=>x.id===chEditing):null;let o=prev?{...prev}:{id:uuid(),image:''};for(let k of ['title','description','kind','genre','when'])o[k]=d.get(k)||'';let rawViews=String(d.get('views')||'').trim();if(rawViews&&(!/^\d+$/.test(rawViews)||!Number.isSafeInteger(Number(rawViews)))){alert('再生回数は0以上の整数で入力してください');return;}o.views=rawViews===''?'':Number(rawViews);try{let file=$('#chEntryImage').files[0];if(file)o.image=await readFile(file);await chPut(o);channelDismiss();channelSelected=o.id;await channelRefresh()}catch(err){alert('保存できませんでした: '+err.message)}}
async function channelRemove(id){if(!confirm('このCHANNELコンテンツを削除しますか？'))return;await chDel(id);channelSelected=null;await channelRefresh()}
function channelDismiss(){dismissOverlay();chEditing=null}
/* Preserve legacy JSON restore, while adding independently stored channel content to backups. */
backup = async function(){
 try{
  let channel=channelDB?await chAll():[];
  const obj={app:'Fanclub Memo',version:2,created:new Date().toISOString(),items:data,
   channelItems:channel,accounts:accounts(),wardrobeOrder:wardrobeGetIds(),wardrobeSort:wardrobeSortMode(),profile:{name:localStorage.memberName||'',no:localStorage.memberNo||'',date:localStorage.memberDate||''}};
  let b=new Blob([JSON.stringify(obj)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');
  a.href=url;a.download='fanclub-memo-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(err){alert('バックアップに失敗しました: '+err.message)}
};
restore = async function(file){
 if(!file)return;
 try{
  let b=JSON.parse(await file.text());
  if(b.app!=='Fanclub Memo'||!Array.isArray(b.items))throw Error('対応しない形式です');
  if(!confirm('バックアップを復元しますか？同じIDの項目は上書きされます。'))return;
  for(let item of b.items)await put(item);
  if(b.profile){localStorage.memberName=b.profile.name||'';localStorage.memberNo=b.profile.no||'';localStorage.memberDate=b.profile.date||''}
  if(Array.isArray(b.accounts))localStorage.setItem('fc_accounts',JSON.stringify(b.accounts));
  if(Array.isArray(b.wardrobeOrder))localStorage.setItem('fc_wardrobe_order_v1',JSON.stringify(b.wardrobeOrder));
  if(['new','old','custom'].includes(b.wardrobeSort))localStorage.setItem('fc_wardrobe_sort_v1',b.wardrobeSort);
  if(Array.isArray(b.channelItems)){
   if(!channelDB)throw Error('CHANNELの保存領域が開けていません。後で再試行してください');
   for(let item of b.channelItems)await chPut(item);
   await channelRefresh();
  }
  await update();alert('復元しました');
 }catch(err){alert('復元できませんでした: '+err.message)}
};


/* v6.4: CHANNEL card action menu, independent of the other categories. */
function chToggleMenu(ev,id){
 ev.preventDefault();ev.stopPropagation();
 const trigger=ev.currentTarget;
 const alreadyOpen=trigger.parentElement.querySelector('.ch-card-menu');
 document.querySelectorAll('.ch-card-menu').forEach(el=>el.remove());
 if(alreadyOpen)return;
 const menu=document.createElement('div');menu.className='ch-card-menu';
 const edit=document.createElement('button');edit.type='button';edit.textContent='編集';
 edit.onclick=(event)=>{event.stopPropagation();menu.remove();channelEntryEditor(id)};
 const remove=document.createElement('button');remove.type='button';remove.textContent='削除';
 remove.onclick=(event)=>{event.stopPropagation();menu.remove();channelRemove(id)};
 menu.onclick=(event)=>event.stopPropagation();menu.append(edit,remove);
 trigger.parentElement.appendChild(menu);
}
document.addEventListener('click',(ev)=>{if(!ev.target.closest('.ch-card-menu,.ch-menu-trigger'))document.querySelectorAll('.ch-card-menu').forEach(el=>el.remove())});

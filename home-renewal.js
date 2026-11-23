/* HOME renewal and SPECIAL editor navigation repair. UI-only; existing DB/schema untouched. */
(function(){
'use strict';
const escHome=e;
const byNewest=type=>data.filter(o=>o.type===type).sort((a,b)=>new Date(b.when||0)-new Date(a.when||0));
const empty='<div class="home-empty">まだ登録がありません</div>';
const date=o=>o?.when?day(o.when):'';
const headline=(type,icon)=>`<div class="home-section-head"><h3>${type}</h3><button type="button" class="home-all" onclick="event.stopPropagation();go('${type}')">VIEW ALL →</button></div>`;
const section=(type,icon,body)=>`<section class="tile home-section home-${type.toLowerCase()}">${headline(type,icon)}${body}</section>`;
const openList=type=>`onclick="go('${type}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter')go('${type}')"`;
const openDetail=id=>`onclick="detail('${escHome(id)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter')detail('${escHome(id)}')"`;
const cover=(o,cls,alt='画像')=>o?.images?.[0]?`<img class="${cls}" src="${o.images[0]}" alt="${escHome(alt)}" loading="lazy">`:`<div class="${cls} home-image-empty" aria-label="画像未登録">✧</div>`;
const summaries={};
// Draw a set once per app session; navigation back to HOME doesn't cause a new draw.
const randomly=(key,arr,n)=>{
 const ids=arr.map(o=>o.id).join('|');
 if(!summaries[key]||summaries[key].ids!==ids){const pool=[...arr];for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}summaries[key]={ids,chosen:pool.slice(0,n).map(o=>o.id)};}
 return summaries[key].chosen.map(id=>arr.find(o=>o.id===id)).filter(Boolean);
};
const information=()=>section('INFORMATION','ℹ️',byNewest('INFORMATION').slice(0,3).map(o=>`<article class="home-news-item" ${openDetail(o.id)}><div class="home-news-meta"><time>${escHome(date(o))}</time>${categoryBadge(o.category||'OTHER')}${membersOnlyTag(o)}</div><div class="home-news-title">${escHome(o.title||'無題')}</div></article>`).join('')||empty);
const profileHome=()=>`<section class="tile home-section home-profile" id="homeArtistProfile">${window.artistProfileHomeMarkup?window.artistProfileHomeMarkup():'<div class="home-empty">PROFILEを読み込めませんでした</div>'}</section>`;
const thread=()=>section('THREAD','📓',byNewest('THREAD').length?`<div class="home-thread-scroller">${byNewest('THREAD').slice(0,5).map(o=>{const guest=o.threadGuest?.enabled;const name=guest?(o.threadGuest.name||o.artist||'MEMBER'):(o.artist||'投稿者未設定');const face=guest?(o.threadGuest.image?`<img class="avatar" src="${o.threadGuest.image}" alt="">`:`<span class="avatar avatar-fallback">${escHome(name.slice(0,1))}</span>`):avatar(name);const badge=guest?'<span class="pill role-member">MEMBER</span>':roleBadge(name);return `<article class="home-thread-card" ${openDetail(o.id)}><div class="home-thread-author">${face}<div class="home-thread-identity"><div class="home-author-name">${escHome(name)} ${badge}</div><div class="meta">${escHome(date(o))}</div></div></div><p class="home-4lines">${escHome(o.body||o.title||'')}</p><div class="meta">返信 ${(o.replies||[]).length}件</div></article>`}).join('')}</div>`:empty);
const formatHomeFeedReplies=n=>{const count=Math.max(0,Math.floor(Number(n)||0));return count<1000?String(count):count<1000000?(Math.floor(count/100)/10).toFixed(1)+'K':(Math.floor(count/100000)/10).toFixed(1)+'M'};
const homeCommentCountMarkup=o=>`<span class="feed-comment-count" aria-label="コメント ${Number.isSafeInteger(o.feedReplyCountOverride)&&o.feedReplyCountOverride>=0?o.feedReplyCountOverride:(o.replies||[]).length}件"><svg class="feed-comment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.95L3 20l1-4.5a8.5 8.5 0 1 1 16.5-4Z"/></svg><span>${formatHomeFeedReplies(Number.isSafeInteger(o.feedReplyCountOverride)&&o.feedReplyCountOverride>=0?o.feedReplyCountOverride:(o.replies||[]).length)}</span></span>`;
const feed=()=>section('FEED','🪄',byNewest('FEED').length?`<div class="home-thread-scroller home-feed-scroller">${byNewest('FEED').slice(0,5).map(o=>{const guest=o.feedGuest?.enabled;const name=guest?(o.feedGuest.name||o.artist||'MEMBER'):(o.artist||'投稿者未設定');const face=guest?(o.feedGuest.image?`<img class="avatar" src="${escHome(o.feedGuest.image)}" alt="">`:`<span class="avatar avatar-fallback">${escHome(name.slice(0,1))}</span>`):avatar(name);const badge=guest?'<span class="pill role-member">MEMBER</span>':roleBadge(name);return `<article class="home-thread-card home-feed-slide" ${openDetail(o.id)}><div class="home-thread-author">${face}<div class="home-thread-identity"><div class="home-author-name">${escHome(name)} ${badge}</div><div class="meta">${escHome(date(o))}</div></div></div><p class="home-4lines">${escHome(o.body||o.title||'')}</p><div class="home-feed-comment-meta">${homeCommentCountMarkup(o)}</div></article>`}).join('')}</div>`:empty);
const message=()=>{
 const latest=byNewest('MESSAGE')[0];
 if(!latest)return section('MESSAGE','💭',`<div class="home-message-simple" ${openList('MESSAGE')}><div class="home-message-copy"><strong>メッセージはまだありません</strong></div><span class="home-message-arrow" aria-hidden="true">›</span></div>`);
 const now=Date.now(),when=new Date(latest.when||0).getTime();
 const fresh=Number.isFinite(when)&&when<=now&&now-when<7*24*60*60*1000;
 return section('MESSAGE','💭',`<div class="home-message-simple" ${openList('MESSAGE')}>${fresh?'<span class="home-new home-new-inline">NEW</span>':''}<div class="home-message-copy"><strong>${fresh?'新しいメッセージが届いています ♡':'メッセージを見る ♡'}</strong><div class="meta">${escHome(date(latest))}</div></div><span class="home-message-arrow" aria-hidden="true">›</span></div>`);
};
// HOME GALLERY: three independent random photos, arranged as a three-photo stack.
const gallery=()=>{
 const albums=byNewest('GALLERY');
 const photos=albums.flatMap(o=>(o.images||[]).map((src,i)=>({id:o.id+':'+i,src})));
 const chosen=randomly('gallery',photos,3);
 return section('GALLERY','📷',chosen.length?`<div class="home-gallery-stack" ${openList('GALLERY')}>${chosen.map((p,i)=>`<div class="home-gallery-photo home-gallery-photo-${i+1}"><img src="${p.src}" alt="GALLERYの写真 ${i+1}" loading="lazy"></div>`).join('')}</div>`:empty);
};
// HOME MOVIE: compact, full-bleed, horizontally swipable video thumbnails.
const movie=()=>{
 const movies=byNewest('MOVIE').slice(0,5);
 return section('MOVIE','🎥',movies.length?`<div class="home-movie-scroller" aria-label="動画一覧・左右にスワイプできます">${movies.map(o=>`<article class="home-movie-card" ${openDetail(o.id)} aria-label="${escHome(o.title||'無題の動画')}を開く">${o.images?.[0]?`<img class="home-movie-cover" src="${o.images[0]}" alt="" loading="lazy">`:'<div class="home-movie-cover home-image-empty" aria-hidden="true"></div>'}<div class="home-movie-title">${escHome(o.title||'無題の動画')}</div><span class="home-movie-play" aria-hidden="true"><svg viewBox="0 0 38 38" width="38" height="38" focusable="false"><circle cx="19" cy="19" r="19" fill="white" fill-opacity=".20"/><path d="M15 11.8 Q14 11.4 14 13.5 V24.5 Q14 26.6 16.2 25.4 L26 20.3 Q28 19 26 17.7 Z" fill="white"/></svg></span></article>`).join('')}</div>`:empty);
};
const music=()=>{let songs=randomly('music',byNewest('MUSIC'),3);return section('MUSIC','🎧',songs.length?`<div class="home-music-chart" ${openList('MUSIC')}><div class="home-eyebrow">TOP SONGS</div>${songs.map((o,i)=>`<div class="home-music-row"><span class="home-rank">0${i+1}</span>${cover(o,'home-music-cover',o.title||'ジャケット')}<div class="home-music-title"><strong>${escHome(o.title||'無題の曲')}</strong><span class="meta">${escHome(o.artist||'')}</span></div><span class="home-chevron">›</span></div>`).join('')}</div>`:empty)};
const wardrobe=()=>{let a=data.filter(o=>o.type==='WARDROBE'),ids=wardrobeGetIds(),pos=new Map(ids.map((id,i)=>[id,i]));a.sort((x,y)=>(pos.get(x.id)??Infinity)-(pos.get(y.id)??Infinity)||new Date(y.when||0)-new Date(x.when||0));return section('WARDROBE','👗',a.length?`<div class="home-wardrobe-shelf" ${openList('WARDROBE')}>${a.slice(0,3).map(o=>`<div class="home-wardrobe-book">${o.images?.[0]?`<img src="${o.images[0]}" alt="${escHome(o.title||'ルックブック')}" loading="lazy">`:'<div class="home-image-empty">LOOKBOOK</div>'}<strong>${escHome(o.title||'無題のルックブック')}</strong></div>`).join('')}</div>`:empty)};
const archive=()=>section('ARCHIVE','🗂️',window.archiveHomeFolders?window.archiveHomeFolders(byNewest('ARCHIVE').slice(0,3)):empty);
const special=()=>{const o=byNewest('SPECIAL')[0];return section('SPECIAL','💌',o?`<div class="home-special-simple" ${openList('SPECIAL')}><div class="home-special-simple-copy"><strong>${escHome(o.title||'無題のコンテンツ')}</strong><div class="meta">${escHome(date(o))}</div></div><span class="home-special-sparkles" aria-hidden="true">✧</span></div>`:empty)};
const previousHome=home;
home=function(){return `<div class="home-visual-bleed" aria-label="HOMEメインビジュアル">${window.fanclubHomeVisualMarkup?window.fanclubHomeVisualMarkup():'<div class="home-visual-placeholder" aria-hidden="true"></div>'}</div><div class="widgets home-widgets">${[information,profileHome,feed,message,gallery,movie,music,wardrobe,archive,special].map(fn=>fn()).join('')}</div><h3>RECENT UPDATES</h3>${listing([...data].filter(o=>!['THREAD','PROFILE','HOME_VISUAL'].includes(o.type)).sort((a,b)=>new Date(b.when||0)-new Date(a.when||0)).slice(0,5))}`};
// Route SPECIAL add/edit directly to its own editor, preserving the greeting-card handler.
const priorEditor=editor;
editor=function(id){const item=id?data.find(o=>o.id===id):null;if((item?.type||page)==='SPECIAL'){try{return specialEditor(id)}catch(err){console.error('SPECIAL edit transition failed:',err);alert('SPECIAL編集画面を開けませんでした: '+err.message);return}}return priorEditor(id)};
})();

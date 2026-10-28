import { useEffect, useRef, useState } from 'react';
import { SiteHeader } from './components/SiteHeader';
import { CreatorPoster } from './components/CreatorPoster';
import { PirateSkullIcon } from './components/ReferenceIcons';
import { useWallet } from './wallet';
import { Link } from './router';
import { ProfileIcon as Icon } from './components/ProfileIcon';
import './ProfilePage.css';
import './ProfileDesktop.css';
import './ProfileMobile.css';

type Tab = 'My Posters' | 'Activity' | 'Leaderboard' | 'Wallet' | 'Rewards' | 'Settings';
type Profile = { name:string; bio:string; avatar:string };
type Card = { name:string; index:number; amount:string; hidden:boolean; main:boolean };
const initial:Profile={name:'Your Pirate Name',bio:'A small pirate with big dreams.\nPart of the BERI crew.',avatar:'/portraits/home-luffy.jpg'};
const samples:Card[]=[{name:'Your Name',index:0,amount:'1250000000',hidden:false,main:true},{name:'Zoro',index:2,amount:'980000000',hidden:false,main:false},{name:'Nami',index:1,amount:'720000000',hidden:false,main:false},{name:'Sanji',index:7,amount:'680000000',hidden:false,main:false}];
const fine='KONO SAKUHIN WA FICTION DESUNODE JITSUZAISURU JINBUTSU DANTAI SONOTA NO SOSHIKI TO DOITSU NO MEISHOU GA GEKICHU NI TOUJYOU SHITATOSHITEMO JITSUZAI NA MONOTOWA ISSAI MUKANKEIDESU';
const achievements=[['hat','Beri Holder','Hold BERI in your wallet.'],['chart','Rising Star','Increase your bounty ranking.'],['coins','Steady Grinder','Consistent holdings over time.'],['wheel','Early Crew','One of the early community members.']];
export function ProfilePage(){
 const {address,holdings,isHolder,openModal,refreshHoldings}=useWallet();
 const [profile,setProfile]=useState<Profile>(initial),[draft,setDraft]=useState(initial),[tab,setTab]=useState<Tab>('My Posters'),[cards,setCards]=useState(samples),[activity,setActivity]=useState<string[]>([]),[notice,setNotice]=useState(''),[editing,setEditing]=useState<number|null>(null),[posterName,setPosterName]=useState('');
 const editor=useRef<HTMLDialogElement>(null),posterEditor=useRef<HTMLDialogElement>(null),upload=useRef<HTMLInputElement>(null),rail=useRef<HTMLDivElement>(null);
 const [galleryPage,setGalleryPage]=useState({index:0,count:1,step:0});
 useEffect(()=>{
  const element=rail.current;
  if(tab!=='My Posters'||!element)return;
  const measure=()=>{
   const card=element.querySelector('article');
   if(!card)return;
   const gap=parseFloat(getComputedStyle(element).columnGap)||0;
   const cardWidth=card.getBoundingClientRect().width+gap;
   const visible=Math.max(1,Math.round((element.clientWidth+gap)/cardWidth));
   const step=visible*cardWidth;
   const count=Math.max(1,Math.ceil(cards.length/visible));
   setGalleryPage({index:Math.min(count-1,Math.round(element.scrollLeft/step)),count,step});
  };
  const observer=new ResizeObserver(measure);
  observer.observe(element);
  element.addEventListener('scroll',measure,{passive:true});
  measure();
  return()=>{observer.disconnect();element.removeEventListener('scroll',measure);};
 },[tab,cards.length]);
 const scrollGallery=(page:number)=>rail.current?.scrollTo({left:page*galleryPage.step,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 const key=`wanted:profile:${address??'guest'}`;
 useEffect(()=>{document.title='My Profile | Wanted Bounty';},[]);
 useEffect(()=>{let next=initial;try{const p=JSON.parse(localStorage.getItem(key)||'null');if(p&&typeof p.name==='string'&&typeof p.bio==='string'&&typeof p.avatar==='string')next=p;}catch{}setProfile(next);setCards(samples);setActivity([]);},[key]);
 const save=(next:Profile)=>{try{localStorage.setItem(key,JSON.stringify(next));setProfile(next);setNotice('Profile saved on this device.');}catch{setNotice('Unable to save. Your browser storage may be full.');}};
 const log=(message:string)=>{setActivity(a=>[message,...a]);setNotice(message);};
 const select=(next:Tab)=>{setTab(next);};
 const balance=holdings.state==='ready'?holdings.display:address?'Unavailable':'Connect wallet';
 return <div className="profile-page"><SiteHeader active="profile"/><div className="profile-harbor" aria-hidden="true"/>
 <main className="profile-layout">
 <aside className="profile-sidebar profile-paper"><h1><Icon kind="user"/> My Profile</h1>{(['My Posters','Leaderboard','Wallet','Rewards','Settings'] as Tab[]).map((t,i)=><button key={t} className={tab===t?'active':''} aria-pressed={tab===t} onClick={()=>select(t)}><Icon kind={['posters','chart','wallet','cup','settings'][i]}/>{t}</button>)}</aside>
 <div className="profile-main-column"><section className="profile-summary profile-paper" aria-label="Pirate profile"><div className="profile-identity"><div className="profile-avatar"><img src={profile.avatar} alt="Your profile portrait"/><button aria-label="Change profile photo" onClick={()=>upload.current?.click()}><Icon kind="photo"/></button><input hidden ref={upload} type="file" accept="image/jpeg,image/png" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png'].includes(file.type)||file.size>2*1024*1024){setNotice('Choose a JPG or PNG smaller than 2 MB.');return;}const reader=new FileReader();reader.onload=()=>save({...profile,avatar:String(reader.result)});reader.readAsDataURL(file);e.target.value='';}}/></div><div className="profile-bio"><div className="profile-name-row"><div className="profile-name"><PirateSkullIcon/><h2>{profile.name}</h2></div><button className="profile-edit-button" aria-label="Edit profile" onClick={()=>{setDraft(profile);editor.current?.showModal();}}><span className="profile-edit-glyph">✎</span><span className="profile-edit-label">Edit Profile</span></button></div><p>{profile.bio}</p><div className="profile-badges"><span><Icon kind="wheel"/>{isHolder?'Beri Holder':'Pirate'}</span><span><Icon kind="beri"/>Rising Star</span><span><Icon kind="wheel"/>Crew Member</span></div><small className="profile-joined"><Icon kind="calendar"/> Your story starts here</small></div></div>
 <div className="profile-stats">{[['beri','BERI Balance',holdings.state==='ready'?holdings.display:'—',address?'Your connected wallet':'Connect to view holdings'],['crown','Rank','—','Not ranked yet'],['zcash','Zcash Rewards','—','Rewards not connected'],['wheel','Total Bounty Value','—','Create your first poster']].map(([icon,label,value,detail])=><div key={label}><Icon kind={icon}/><div><h3>{label}</h3><strong>{value}</strong><small>{detail}</small></div></div>)}</div></section>
 <nav className="profile-mobile-tabs profile-paper" aria-label="Profile sections">{(['My Posters','Activity','Leaderboard','Rewards','Settings'] as Tab[]).map((t,i)=><button key={t} className={tab===t?'active':''} aria-pressed={tab===t} onClick={()=>select(t)}><Icon kind={['posters','clock','chart','cup','settings'][i]}/>{t}</button>)}</nav>
 <section className="profile-content profile-paper"><header><div className="profile-content-tabs"><button className={tab==='My Posters'?'chosen':''} onClick={()=>select('My Posters')}>My Wanted Posters</button><button className={tab==='Activity'?'chosen':''} onClick={()=>select('Activity')}>Activity History</button></div><Link className="profile-red" href="/create">＋ Create New Poster</Link></header>
 {tab==='My Posters'?<><p className="profile-demo">Sample collection · preview edits are not published.</p><div className="profile-gallery-wrap"><button className="profile-scroll prev" aria-label="Previous posters" disabled={galleryPage.index===0} onClick={()=>scrollGallery(galleryPage.index-1)}>‹</button><div className="profile-gallery" ref={rail}>{cards.map((c,i)=><article key={c.index}><CreatorPoster name={c.name} bounty={c.amount} portrait="/portraits/explore-crew.png" portraitIndex={c.index} photoClassName="" fine={fine}/><p className="profile-visibility"><i className={c.hidden?'hidden':c.main?'main':''}/>{c.hidden?'Hidden':c.main?'Main Poster':'Public'} </p><div className="profile-card-actions"><button onClick={()=>{setEditing(i);setPosterName(c.name);posterEditor.current?.showModal();}}>Edit</button><button onClick={()=>{setCards(cards.map((p,n)=>n===i?{...p,hidden:!p.hidden}:p));log(`${c.name} ${c.hidden?'shown':'hidden'} in demo.`);}}>{c.hidden?'Show':'Hide'}</button><button aria-label={`Set ${c.name} as main demo poster`} title="Set as main poster" onClick={()=>{setCards(cards.map((p,n)=>({...p,main:n===i})));log(`${c.name} selected as main demo poster.`);}}>☆</button></div></article>)}<Link className="profile-add" href="/create"><strong>＋</strong>Create New Poster<small>Add another wanted poster and grow your bounty.</small></Link></div><button className="profile-scroll next" aria-label="Next posters" disabled={galleryPage.index===galleryPage.count-1} onClick={()=>scrollGallery(galleryPage.index+1)}>›</button></div><div className="profile-pagination" aria-label="Poster carousel pages">{Array.from({length:galleryPage.count},(_,i)=><button key={i} aria-label={`Show poster page ${i+1}`} aria-current={galleryPage.index===i?'page':undefined} onClick={()=>scrollGallery(i)}><span/></button>)}</div></>:tab==='Activity'?<div className="profile-detail"><h2>Activity History</h2>{activity.length?<ul>{activity.map((a,i)=><li key={i}>{a}</li>)}</ul>:<p>No activity this session. Profile and demo poster changes will appear here.</p>}</div>:tab==='Wallet'?<div className="profile-detail"><h2>Your Wallet</h2><p>{balance}{holdings.state==='ready'?' BERI':''}</p><button className="profile-red" onClick={address?refreshHoldings:openModal}>{address?'Refresh Balance':'Connect Wallet'}</button></div>:tab==='Settings'?<div className="profile-detail"><h2>Profile Settings</h2><p>Your profile is saved on this browser, separately for each wallet.</p><button className="profile-red" onClick={()=>{setDraft(profile);editor.current?.showModal();}}>Edit Profile</button></div>:<div className="profile-detail"><h2>{tab}</h2><p>{tab==='Rewards'?'Reward balances are not connected yet. Eligibility and distributions depend on the rewards provider.':'Live community rankings are not available yet. The board alongside this panel is an illustrative preview.'}</p></div>}
 <p className="profile-notice" role="status">{notice}</p></section>
 </div><aside className="profile-community" aria-label="Community rankings and achievements"><section className="profile-ranking profile-paper"><header><h2><Icon kind="cup"/> Wanted Ranking</h2><button onClick={()=>{select('Leaderboard');setNotice('Showing leaderboard information.');}}>View All →</button></header><p className="profile-demo">Sample leaderboard</p>{['2,800,000,000','1,950,000,000','1,320,000,000','980,000,000','760,000,000'].map((n,i)=><div className="profile-rank-row" key={n}><span>{i===0?<Icon kind="crown"/>:i<3?<span className={`profile-medal profile-medal--${i}`}>{i+1}</span>:i+1}</span><span className="profile-rank-avatar" style={{backgroundPosition:`${i*25}% 0%`}}/><strong>{n} BERI</strong></div>)}</section>
 <section className="profile-achievements profile-paper"><header><h2><Icon kind="wheel"/> Achievements</h2><button onClick={()=>{select('Rewards');setNotice('Showing rewards information.');}}>View All →</button></header>{achievements.map(([icon,title,text])=><div className="profile-achievement" key={title}><Icon kind={icon}/><div><h3>{title}</h3><p>{text}</p></div></div>)}<small className="profile-demo">Milestone previews · not awarded yet</small></section></aside>
 </main><footer className="profile-footer">MORE THAN A TOKEN<br/><strong>A CREW</strong><br/>$BERI</footer>
 <dialog className="profile-editor profile-paper" ref={editor} onClick={e=>{if(e.target===e.currentTarget)editor.current?.close();}}><form onSubmit={e=>{e.preventDefault();save({...draft,name:draft.name.trim()||'Your Pirate Name'});log('Profile updated on this device.');editor.current?.close();}}><header><h2>Edit Profile</h2><button type="button" aria-label="Close profile editor" onClick={()=>editor.current?.close()}>×</button></header><label>Pirate Name<input autoFocus maxLength={32} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>Your Story<textarea rows={3} maxLength={180} value={draft.bio} onChange={e=>setDraft({...draft,bio:e.target.value})}/></label><button className="profile-red" type="submit">Save Profile</button></form></dialog>
 <dialog className="profile-editor profile-paper" ref={posterEditor}><form onSubmit={e=>{e.preventDefault();if(editing!==null)setCards(cards.map((c,i)=>i===editing?{...c,name:posterName.trim()||c.name}:c));log('Demo poster name updated.');posterEditor.current?.close();}}><header><h2>Edit Demo Poster</h2><button type="button" aria-label="Close poster editor" onClick={()=>posterEditor.current?.close()}>×</button></header><label>Pirate Name<input autoFocus maxLength={32} value={posterName} onChange={e=>setPosterName(e.target.value)}/></label><button className="profile-red">Save Changes</button></form></dialog>
 </div>;
}

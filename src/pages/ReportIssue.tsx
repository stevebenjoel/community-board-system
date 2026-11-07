import { useEffect,useRef,useState,type FormEvent } from 'react';
import { BOARD_TYPES,type Workspace } from '../../shared/model';
import { CommunitySelect } from '../CommunitySelect';
import { VoiceInput } from '../VoiceInput';
import * as api from '../lib/api';
import { deleteReport,listReports,loadSetup,saveReport,saveSetup,type QueuedReport,type ReportSetup } from '../lib/reportQueue';

export function ReportIssue({workspace,onSignIn,onDetailed,onReceived}:{workspace?:Workspace;onSignIn?:()=>void;onDetailed?:()=>void;onReceived?:(id:string)=>void}){
  const [setup,setSetup]=useState<ReportSetup>();
  const [queued,setQueued]=useState<QueuedReport[]>([]);
  const [online,setOnline]=useState(navigator.onLine);
  const [step,setStep]=useState(1);
  const [preparing,setPreparing]=useState(false);
  const [category,setCategory]=useState('INF');
  const [description,setDescription]=useState('');
  const [audio,setAudio]=useState<Blob>();
  const [voiceActive,setVoiceActive]=useState(false);
  const [jurisdiction,setJurisdiction]=useState('');
  const [location,setLocation]=useState('');
  const [urgency,setUrgency]=useState('NORMAL');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const [receipt,setReceipt]=useState('');
  const owner=workspace?workspace.me?.id:setup?.owner;
  const ownerRef=useRef(owner);ownerRef.current=owner;
  const syncing=useRef(false);
  const preferred=workspace?.residencies.find(item=>item.userId===owner&&item.status==='VERIFIED')?.jurisdiction;
  useEffect(()=>{void loadSetup().then(setSetup).catch(()=>{});},[]);
  useEffect(()=>{
    const connection=()=>setOnline(navigator.onLine);
    window.addEventListener('online',connection);window.addEventListener('offline',connection);
    return ()=>{window.removeEventListener('online',connection);window.removeEventListener('offline',connection);};
  },[]);
  useEffect(()=>{
    setQueued([]);
    if(!owner)return;
    let active=true;
    void listReports(owner).then(items=>{if(active)setQueued(items);}).catch(()=>{if(active)setError('Private report storage is unavailable in this browser.');});
    return ()=>{active=false;};
  },[owner]);

  async function sync(account:string){
    if(syncing.current||!navigator.onLine)return;
    syncing.current=true;setBusy(true);setError('');
    try{
      const send=async()=>{
        const current=await api.getWorkspace();
        if(current.me?.id!==account)throw new Error('Sign in to the account that saved these reports, then retry.');
        for(const report of await listReports(account)){
          if(ownerRef.current!==account)return;
          const id=report.caseId??(await api.command('submitCase',{...report.payload,expectedReporterId:account})).id;
          if(!report.caseId){report.caseId=id;await saveReport(report);}
          if(report.audio){
            const extension=report.audio.type==='audio/mp4'?'m4a':'webm';
            await api.uploadEvidence(new File([report.audio],'voice-report.'+extension,{type:report.audio.type}),'CASE',id,report.id,account);
          }
          await deleteReport(report.id);
          setReceipt(id);setMessage('Received by CBS. You can open the report in Cases.');
        }
      };
      if(navigator.locks)await navigator.locks.request('cbs-report-sync',send);
      else await send();
    }catch(error){setError(error instanceof Error?error.message:'Sending failed. Your report is still saved on this device.');}
    finally{
      if(ownerRef.current===account)try{setQueued(await listReports(account));}catch{/* The stored report remains available when storage recovers. */}
      syncing.current=false;setBusy(false);
    }
  }
  useEffect(()=>{
    if(online&&workspace?.me?.id&&queued.length&&queued[0].owner===workspace.me.id)void sync(workspace.me.id);
    // Retry on reconnect and account changes. Failed transfers stay available for a manual retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[online,workspace?.me?.id,queued.length>0]);

  async function next(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setMessage('');
    if(step===1){
      if(description.trim().length<20&&!audio){setError('Describe what happened in at least 20 characters, or record a voice report.');return;}
      setStep(2);return;
    }
    if(step===2){
      const form=new FormData(event.currentTarget);
      const selected=online&&workspace?String(form.get('jurisdiction')??''):setup&&setup.owner===owner?setup.jurisdiction:'';
      if(!selected){setError('Choose a community before continuing.');return;}
      setJurisdiction(selected);setStep(3);return;
    }
    if(!owner||!jurisdiction)return;
    if(busy)return;
    setBusy(true);
    const id=crypto.randomUUID();
    try{
      const title=description.trim().length>=20?description.trim().replace(/\s+/g,' ').slice(0,100):'Voice report · '+(BOARD_TYPES.find(board=>board.code===category)?.name??'Community issue');
      await saveReport({id,owner,audio,payload:{clientRequestId:id,category,jurisdiction,title,description:description.trim().length>=20?description.trim():'Voice report recorded by the resident. See the private recording attached to this case.',location,urgency}});
      setQueued(await listReports(owner));setMessage(online?'Saved on this device. Sending to CBS…':'Waiting for internet. Saved on this device.');
      setStep(1);setAudio(undefined);setDescription('');setLocation('');setReceipt('');
      if(online)await sync(owner);
    }catch{setError('The report could not be saved. Keep this page open and retry.');}
    finally{setBusy(false);}
  }
  async function prepare(form:HTMLFormElement|null){
    if(!owner||!form)return;
    const picker=form.elements.namedItem('jurisdiction');
    if(!(picker instanceof HTMLSelectElement)||!picker.value){setError('Select a community first.');return;}
    setBusy(true);setError('');
    try{
      if(!('serviceWorker' in navigator))throw new Error('This browser does not support offline pages.');
      await navigator.serviceWorker.register('/report-worker.js');
      await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>window.setTimeout(()=>reject(new Error('Offline setup could not complete. Use the hosted app or a built preview.')),12000))]);
      const saved={owner,jurisdiction:picker.value,community:picker.selectedOptions[0].text};
      await saveSetup(saved);setSetup(saved);
      if(preparing){setPreparing(false);setStep(1);}
      setMessage('Offline reporting is ready. Bookmark this page and reopen it to record or send queued reports.');
    }catch(error){setError(error instanceof Error?error.message:'Offline setup could not complete.');}
    finally{setBusy(false);}
  }
  return <section className="panel report-flow">
    <h1>Report a community issue</h1>
    <p>Step {step} of 3 · {step===1?'What happened?':step===2?'Where did it happen?':'How urgent is it?'}</p>
    {!online&&<p role="status">Offline · Reports stay on this device until CBS receives them.</p>}
    {setup?.owner===owner&&setup&&<p className="muted">Saved for offline use · {setup.community}</p>}
    {!owner?<div><p>{online?'Sign in to report a community issue.':'Prepare offline reporting while signed in and connected before using this page offline.'}</p>{onSignIn&&<button className="button" onClick={onSignIn}>Sign in</button>}</div>:
    <form className="form-fields" onSubmit={event=>void next(event)}>
      {step===1&&<>
        <label>Board<select value={category} onChange={event=>setCategory(event.target.value)}>{BOARD_TYPES.filter(board=>board.code!=='SEC').map(board=><option key={board.code} value={board.code}>{board.name}</option>)}<option value="GENERAL">General</option></select></label>
        <label>What happened?<textarea value={description} onChange={event=>setDescription(event.target.value)} maxLength={10000} rows={4}/></label>
        <VoiceInput onText={setDescription} onAudio={setAudio} onActive={setVoiceActive} audio={audio}/>
        {online&&workspace&&<button type="button" className="text-button" disabled={voiceActive||busy} onClick={()=>{setPreparing(true);setStep(2);}}>Choose a community for offline use</button>}
      </>}
      {step===2&&<>
        {online&&workspace?<CommunitySelect name="jurisdiction" value={jurisdiction||preferred}/>:<p>{setup?.owner===owner?setup.community:'No community saved for offline use.'}</p>}
        <label>Nearby landmark or approximate location<input value={location} onChange={event=>setLocation(event.target.value)} maxLength={500}/></label>
        {online&&workspace&&<button type="button" className="button secondary" disabled={busy} onClick={event=>void prepare(event.currentTarget.form)}>Prepare this device for offline reporting</button>}
      </>}
      {step===3&&<label>Urgency<select value={urgency} onChange={event=>setUrgency(event.target.value)}><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>}
      <div className="action-row">{step>1&&<button type="button" className="button secondary" disabled={busy} onClick={()=>{setPreparing(false);setStep(step-1);}}>Back</button>}{!preparing&&<button className="button" disabled={busy||voiceActive}>{step<3?'Continue':online?'Send report':'Save report for later'}</button>}</div>
    </form>}
    {message&&<p role="status">{message}</p>}
    {error&&<p role="alert" className="form-error">{error}</p>}
    {receipt&&(onReceived?<button className="text-button" onClick={()=>onReceived(receipt)}>Open received report</button>:<a href={'/cases/'+receipt}>Open received report</a>)}
    {queued.length>0&&<section aria-label="Reports saved on this device">
      <h2>Saved on this device</h2>
      {queued.map((item,index)=><div className="action-row" key={item.id}><span>Report {index+1} · {item.caseId?'Received by CBS · recording pending':'Waiting to send'}</span><button type="button" className="text-button" disabled={busy} onClick={async()=>{await deleteReport(item.id);setQueued(await listReports(item.owner));}}>Delete local copy</button></div>)}
      {online&&owner&&<button type="button" className="button secondary" disabled={busy} onClick={()=>void sync(owner)}>Retry sending</button>}
    </section>}
    <p className="muted">Use a trusted device. Queued reports and recordings remain on this browser until sent or deleted. For immediate danger, contact local emergency services.</p>
    {online&&onDetailed&&<button className="text-button" onClick={onDetailed}>Open detailed or confidential safety reporting</button>}
  </section>;
}

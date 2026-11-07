import { useRef,useState } from 'react';
import { BOARD_TYPES } from '../../shared/model';
import { Panel } from '../components';
import { useCBS } from '../context';
import { command,uploadEvidence } from '../lib/api';
import { VoiceInput } from '../VoiceInput';
import { Heading } from './Cases';

export function ReportingDesk(){
  const {w,geoName,signIn,refresh}=useCBS();
  const [community,setCommunity]=useState(w.deskCommunityIds[0]??'');
  const [permission,setPermission]=useState(false),[voiceConsent,setVoiceConsent]=useState(false);
  const [code,setCode]=useState('');
  const [audio,setAudio]=useState<Blob>(),[listening,setListening]=useState(false);
  const [description,setDescription]=useState(''),[consentCode,setConsentCode]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [receipt,setReceipt]=useState<{id:string;reference?:string}>();
  const [uploaded,setUploaded]=useState(false);
  const [recordingAgreed,setRecordingAgreed]=useState(false);
  const requestId=useRef(crypto.randomUUID());

  async function sendAudio(caseId:string){
    if(!audio||!w.me)return;
    const extension=audio.type==='audio/mp4'?'m4a':'webm';
    await uploadEvidence(new File([audio],'voice-report.'+extension,{type:audio.type}),'CASE',caseId,requestId.current,w.me.id);
    setUploaded(true);setAudio(undefined);
  }
  return <>
    <Heading title="Community reporting desk" description="Kaduna South LGA · Consent-based assisted reporting"/>
    {!w.me&&<Panel><p>Sign in to give consent or use an authorized desk account.</p><button className="button" onClick={signIn}>Sign in</button></Panel>}
    {w.me&&<Panel title="Give a facilitator permission">
      {w.deskCommunityIds.length>0?<form className="form-fields" onSubmit={async event=>{
        event.preventDefault();setBusy(true);setError('');setCode('');
        try{
          const result=await command('createDeskConsent',{jurisdiction:community,consent:permission,voice:voiceConsent});
          setCode(result.code??'');
        }catch(error){setError(error instanceof Error?error.message:'Could not create consent.');}
        finally{setBusy(false);}
      }}>
        <label>Verified community<select value={community} onChange={event=>setCommunity(event.target.value)}>{w.deskCommunityIds.map(id=><option key={id} value={id}>{geoName(id)}</option>)}</select></label>
        <label><input type="checkbox" checked={permission} required onChange={event=>setPermission(event.target.checked)}/> I authorize a Kaduna South facilitator to submit one report on my behalf.</label>
        <label><input type="checkbox" checked={voiceConsent} onChange={event=>setVoiceConsent(event.target.checked)}/> I also consent to a private voice recording being attached.</label>
        <button className="button" disabled={busy||!permission}>Create one-time consent code</button>
        {code&&<p role="status">Show this code only to your facilitator. It expires in 30 minutes. <strong>{code}</strong></p>}
      </form>:<p>Verified membership in a Kaduna South community is required to give consent.</p>}
    </Panel>}
    {w.deskFacilitator&&<Panel title="Submit an assisted report">
      <p>Explain the report and read it back to the resident before sending. Ask for their one-time code. Use the confidential intake channel for safety or conduct concerns.</p>
      {receipt?<section>
        <p role="status">Received by CBS · <strong>{receipt.reference??receipt.id}</strong></p>
        <p>Give the reference to the resident so they can find the report under Cases & reports.</p>
        {audio&&!uploaded&&<button className="button secondary" disabled={busy} onClick={async()=>{
          setBusy(true);setError('');
          try{await sendAudio(receipt.id);}
          catch(error){setError(error instanceof Error?error.message:'Voice upload failed.');}
          finally{setBusy(false);}
        }}>Retry voice upload</button>}
        {uploaded&&<p>Voice recording received by the private evidence vault for scanning.</p>}
        {!audio&&<button className="text-button" onClick={()=>{setReceipt(undefined);setUploaded(false);setDescription('');setConsentCode('');setRecordingAgreed(false);requestId.current=crypto.randomUUID();}}>Start another report</button>}
      </section>:<form className="form-fields" onSubmit={async event=>{
        event.preventDefault();setBusy(true);setError('');
        const data=new FormData(event.currentTarget);
        try{
          const result=await command('submitDeskCase',{
            code:consentCode.trim(),clientRequestId:requestId.current,category:data.get('category'),
            title:String(data.get('title')??'').trim()||(audio?'Assisted voice report':description.trim().slice(0,100)),
            description:description.trim()||'Voice report provided by the resident at the community reporting desk.',location:data.get('location'),urgency:data.get('urgency'),voice:!!audio,
          });
          setReceipt(result);
          await sendAudio(result.id);
          await refresh();
        }catch(error){setError(error instanceof Error?error.message:'Could not submit the report.');}
        finally{setBusy(false);}
      }}>
        <label>Resident consent code<input value={consentCode} onChange={event=>setConsentCode(event.target.value)} required autoComplete="off"/></label>
        <label>Board<select name="category">{BOARD_TYPES.filter(board=>board.code!=='SEC').map(board=><option key={board.code} value={board.code}>{board.name}</option>)}<option value="GENERAL">General</option></select></label>
        <label>Report title (optional)<input name="title" minLength={5} maxLength={160}/></label>
        <label>What happened?<textarea value={description} onChange={event=>setDescription(event.target.value)} required={!audio} minLength={20} maxLength={10000} rows={4}/></label>
        <label><input type="checkbox" checked={recordingAgreed} disabled={listening} onChange={event=>{setRecordingAgreed(event.target.checked);if(!event.target.checked)setAudio(undefined);}}/> The resident agreed to use the microphone.</label>
        {recordingAgreed&&<VoiceInput onText={setDescription} onAudio={setAudio} onActive={setListening} audio={audio}/>}
        <label>Nearby landmark<input name="location" maxLength={500}/></label>
        <label>Urgency<select name="urgency"><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
        <button className="button" disabled={busy||listening}>Send assisted report</button>
      </form>}
    </Panel>}
    {error&&<p role="alert" className="form-error">{error}</p>}
  </>;
}

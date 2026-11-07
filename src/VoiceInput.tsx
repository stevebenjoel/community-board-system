import { useEffect,useRef,useState } from 'react';

type SpeechResult=ArrayLike<{transcript:string}>&{isFinal:boolean};
type SpeechSession={lang:string;continuous:boolean;interimResults:boolean;onresult:((event:{results:ArrayLike<SpeechResult>})=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type SpeechBrowser=Window&{SpeechRecognition?:new()=>SpeechSession;webkitSpeechRecognition?:new()=>SpeechSession};
export function VoiceInput({onText,onAudio,onActive,audio}:{onText:(text:string)=>void;onAudio:(audio?:Blob)=>void;onActive:(active:boolean)=>void;audio?:Blob}){
  const [recording,setRecording]=useState(false),[dictating,setDictating]=useState(false),[error,setError]=useState(''),[url,setUrl]=useState('');
  const [opening,setOpening]=useState(false);
  const mounted=useRef(false);
  const listening=useRef(false);
  const restart=useRef<number|undefined>(undefined);
  const recorder=useRef<MediaRecorder|null>(null),speech=useRef<SpeechSession|null>(null),timer=useRef<number|undefined>(undefined);
  const browser=window as SpeechBrowser;
  const Recognition=browser.SpeechRecognition??browser.webkitSpeechRecognition;
  useEffect(()=>{
    mounted.current=true;
    return ()=>{
      mounted.current=false;
      listening.current=false;
      window.clearTimeout(restart.current);
      if(recorder.current){recorder.current.onstop=null;recorder.current.stream.getTracks().forEach(track=>track.stop());}
      speech.current?.abort();
      window.clearTimeout(timer.current);
    };
  },[]);
  useEffect(()=>{onActive(recording||dictating||opening);return ()=>onActive(false);},[recording,dictating,opening,onActive]);
  useEffect(()=>{
    if(!audio){setUrl('');return;}
    const next=URL.createObjectURL(audio);setUrl(next);
    return ()=>URL.revokeObjectURL(next);
  },[audio]);
  async function record(){
    setError('');setOpening(true);
    let stream:MediaStream|undefined;
    try{
      const mime=['audio/webm','audio/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
      if(!mime)throw new Error('This browser cannot record a supported audio format.');
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(!mounted.current){stream.getTracks().forEach(track=>track.stop());return;}
      const session=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:32000});
      const chunks:Blob[]=[];
      session.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      session.onstop=()=>{
        window.clearTimeout(timer.current);
        session.stream.getTracks().forEach(track=>track.stop());
        recorder.current=null;setRecording(false);
        const file=new Blob(chunks,{type:mime});
        if(file.size&&file.size<=4*1024*1024)onAudio(file);
        else setError('Recording is empty or exceeds 4 MiB. Try a shorter recording.');
      };
      session.start();recorder.current=session;setRecording(true);
      timer.current=window.setTimeout(()=>{if(session.state==='recording')session.stop();},90000);
    }catch(error){
      stream?.getTracks().forEach(track=>track.stop());
      setError(error instanceof Error?error.message:'Microphone could not be opened.');
    }finally{if(mounted.current)setOpening(false);}
  }
  function dictate(){
    if(!Recognition)return;
    setError('');
    listening.current=true;
    setDictating(true);
    let transcript='';
    const start=()=>{
      if(!mounted.current||!listening.current)return;
      const session=new Recognition();
      speech.current=session;
      session.lang='en-NG';
      session.continuous=true;
      session.interimResults=true;
      let finalText='';
      session.onresult=event=>{
        const results=Array.from(event.results);
        finalText=results.filter(result=>result.isFinal).map(result=>result[0].transcript.trim()).join(' ');
        onText([transcript,...results.map(result=>result[0].transcript.trim())].filter(Boolean).join(' '));
      };
      session.onerror=event=>{
        if(event.error==='no-speech'||event.error==='aborted')return;
        listening.current=false;
        setError('Dictation unavailable. Try recording a voice report.');
      };
      session.onend=()=>{
        if(!mounted.current)return;
        speech.current=null;
        transcript=[transcript,finalText].filter(Boolean).join(' ');
        if(listening.current)restart.current=window.setTimeout(start,350);
        else setDictating(false);
      };
      try{session.start();}
      catch{listening.current=false;speech.current=null;setDictating(false);setError('Dictation could not start. Try recording a voice report.');}
    };
    start();
  }
  function stopDictation(){
    listening.current=false;
    window.clearTimeout(restart.current);
    if(speech.current)speech.current.stop();
    else setDictating(false);
  }
  return <div className="voice-controls">
    <div className="action-row">
      {Recognition&&<button className="button secondary" type="button" disabled={recording||opening} onClick={dictating?stopDictation:dictate}>{dictating?'Stop dictation':'Speak to fill the form'}</button>}
      {typeof MediaRecorder!=='undefined'&&navigator.mediaDevices&&<button className="button secondary" type="button" disabled={dictating||opening} onClick={()=>recording?recorder.current?.stop():void record()}>{recording?'Stop recording':'Record a voice report'}</button>}
    </div>
    <small>Dictation may use your browser’s online speech service. Recording works offline and stops after 90 seconds.</small>
    {recording&&<p role="status">Recording your voice. Stop before sending.</p>}
    {error&&<p role="alert">{error}</p>}
    {url&&<><audio controls src={url}/><button type="button" className="text-button" onClick={()=>onAudio(undefined)}>Remove recording</button></>}
  </div>;
}

import { useEffect,useState } from 'react';
import { Panel } from '../components';
import { useCBS } from '../context';
import * as api from '../lib/api';
import { Heading } from './Cases';

export function Join(){
  const {w,go,refresh}=useCBS();
  const [mode,setMode]=useState<'register'|'login'|'recover'>('register');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  async function checkEmail(){
    setBusy(true);setError('');
    try{await api.syncAccount();await refresh();}
    catch(error){setError(error instanceof Error?error.message:'Could not refresh account.');}
    finally{setBusy(false);}
  }
  useEffect(()=>{if(!w.me&&w.mode==='appwrite')void api.restoreAccount().then(refresh).catch(()=>{});},[w.me,w.mode,refresh]);
  const residency=w.residencies.find(item=>item.userId===w.me?.id&&['PENDING','VERIFIED'].includes(item.status));
  if(w.me)return <>
    <Heading title="Your community membership" description="Complete your account and community verification."/>
    <Panel title={w.me.verified?'Choose your community':'Verify your email address'}>
      <p>Signed in as {w.me.name} · {w.me.email}</p>
      {!w.me.verified?<>
        <p>Open the verification link sent to your email address, then continue here.</p>
        <div className="action-row">
          <button className="button" disabled={busy} onClick={()=>void checkEmail()}>I have verified my email</button>
          <button className="button secondary" disabled={busy} onClick={async()=>{
            setBusy(true);setError('');
            try{await api.sendVerification();setNotice('Verification email requested. Check your inbox and spam folder.');}
            catch(error){setError(error instanceof Error?error.message:'Could not send verification email.');}
            finally{setBusy(false);}
          }}>Resend verification email</button>
        </div>
      </>:<>
        <p>{residency?.status==='VERIFIED'?'Your community membership is verified.':residency?.status==='PENDING'?'Your community request is waiting for an authorized coordinator to review it.':'Select your state, LGA, ward and community, then submit your residency request.'}</p>
        <button className="button" onClick={()=>go('/community')}>{residency?'View community membership':'Continue to my community'}</button>
      </>}
      <button className="text-button" disabled={busy} onClick={async()=>{
        setBusy(true);setError('');
        try{await api.signOut();await refresh();}catch(error){setError(error instanceof Error?error.message:'Could not sign out.');}
        finally{setBusy(false);}
      }}>Use another account</button>
      {notice&&<p role="status">{notice}</p>}
      {error&&<p role="alert" className="form-error">{error}</p>}
    </Panel>
  </>;
  return <>
    <Heading title={mode==='register'?'Join your community':mode==='login'?'Welcome back':'Recover your account'} description="Create your personal CBS account and apply to join your community."/>
    <Panel className="registration-panel">
      {w.mode==='synthetic'?<p>Real registration is available on the hosted CBS website.</p>:<form className="form-fields" onSubmit={async event=>{
        event.preventDefault();
        const values=new FormData(event.currentTarget);
        const email=String(values.get('email')).trim();
        const password=String(values.get('password')??'');
        if(mode==='register'&&password!==values.get('confirm')){setError('The passwords must match.');return;}
        setBusy(true);setError('');setNotice('');
        try{
          if(mode==='recover'){
            await api.recover(email);
            setNotice('If eligible, recovery instructions will arrive by email.');
          }else{
            if(mode==='register'){
              const result=await api.register(String(values.get('name')).trim(),email,password);
              if(!result.verificationSent)setNotice('Your account was created. Use Resend verification email to try sending the link again.');
            }else await api.login(email,password);
            await refresh();
          }
        }catch(error){
          setError(error instanceof Error?error.message:'Could not complete this request.');
        }finally{setBusy(false);}
      }}>
        {mode==='register'&&<label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={128} required disabled={busy}/></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" required disabled={busy}/></label>
        {mode!=='recover'&&<label>Password<input name="password" type="password" autoComplete={mode==='register'?'new-password':'current-password'} minLength={mode==='register'?8:1} maxLength={256} required disabled={busy}/></label>}
        {mode==='register'&&<>
          <label>Confirm password<input name="confirm" type="password" autoComplete="new-password" required disabled={busy}/></label>
          <p>Review the <a href="/privacy">privacy notice</a> and <a href="/governance">participation terms</a> before creating an account.</p>
        </>}
        {error&&<p role="alert" className="form-error">{error}</p>}
        {notice&&<p role="status">{notice}</p>}
        <button className="button" disabled={busy}>{busy?'Please wait…':mode==='register'?'Create account':mode==='login'?'Sign in':'Send recovery email'}</button>
      </form>}
      <div className="action-row">{(['register','login','recover'] as const).filter(item=>item!==mode).map(item=><button key={item} className="text-button" disabled={busy} onClick={()=>{setMode(item);setError('');setNotice('');}}>{item==='register'?'Create an account':item==='login'?'Already registered? Sign in':'Forgot password?'}</button>)}</div>
    </Panel>
  </>;
}

import type { Principal } from '../shared/model.ts';
import { appwrite } from './store.ts';

export async function appwritePrincipal(jwt:string,request=appwrite):Promise<Principal>{
  const credential={jwt};
  // Appwrite must validate the token before any claims are used.
  const account=await request('/account','GET',undefined,credential);
  const claims=JSON.parse(Buffer.from(jwt.split('.')[1]??'','base64url').toString('utf8')) as {userId?:string;sessionId?:string};
  if(claims.userId!==account.$id||typeof claims.sessionId!=='string'||!claims.sessionId)throw new Error('Invalid session claims.');
  // JWT requests have no cookie-backed "current" session on Appwrite 1.8.1.
  const session=await request('/account/sessions/'+encodeURIComponent(claims.sessionId),'GET',undefined,credential);
  if(session.$id!==claims.sessionId||session.userId!==account.$id)throw new Error('Session does not belong to this account.');
  return {
    id:String(account.$id),name:String(account.name||'Resident'),email:String(account.email||''),
    verified:account.emailVerification===true||account.phoneVerification===true,
    mfa:Array.isArray(session.factors)&&session.factors.length>=2,
  };
}

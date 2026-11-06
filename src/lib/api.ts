import { Account, Client, ID, AuthenticationFactor, AuthenticatorType } from 'appwrite';
import type { Workspace } from '../../shared/model';
export interface RuntimeConfig { mode:'synthetic'|'appwrite'; testingMode:boolean; appwriteEndpoint:string; appwriteProjectId:string }
let settings:RuntimeConfig;
let account:Account|null=null;
export async function initApi(){settings=await request<RuntimeConfig>('/config');if(settings.mode==='appwrite')account=new Account(new Client().setEndpoint(settings.appwriteEndpoint).setProject(settings.appwriteProjectId));return settings;}
async function authHeaders(){
  const headers:Record<string,string>={'Content-Type':'application/json','X-CBS-Client':'web'};
  if(account)try{headers.Authorization=`Bearer ${(await account.createJWT()).jwt}`;}catch{/* Public pages remain available while signed out. */}
  return headers;
}
export async function request<T>(path:string,payload?:unknown):Promise<T>{
  const headers=await authHeaders();
  const response=await fetch(`/api/v1${path}`,{method:payload===undefined?'GET':'POST',headers,credentials:'same-origin',body:payload===undefined?undefined:JSON.stringify(payload)});
  const value=await response.json();if(!response.ok)throw new Error(value.error?.message??'The service is unavailable. Please retry.');return value as T;
}
export const getWorkspace=()=>request<Workspace>('/workspace');
export const command=(action:string,payload:unknown)=>request<{id:string}>('/commands',{action,payload});
export const demoSignIn=(userId:string)=>request('/demo-session',{userId});
export async function signOut(){if(account)await account.deleteSession({sessionId:'current'});await request('/logout',{});}
export async function login(email:string,password:string){if(!account)throw new Error('Choose a synthetic profile in the local pilot.');await account.createEmailPasswordSession({email,password});await request('/session',{});}
export async function sendVerification(){if(!account)throw new Error('Appwrite is not connected.');await account.createVerification({url:`${location.origin}/auth/verify`});}
export async function restoreAccount(){if(!account)return;await account.get();await request('/session',{});}
export async function syncAccount(){if(account)await request('/session',{});}
export async function register(name:string,email:string,password:string){
  if(!account)throw new Error('Registration requires an Appwrite connection.');
  await account.create({userId:ID.unique(),email,password,name});
  await account.createEmailPasswordSession({email,password});
  await request('/session',{});
  if(settings.testingMode)return {verificationSent:true};
  try{await sendVerification();return {verificationSent:true};}
  catch{return {verificationSent:false};}
}
export async function recover(email:string){if(!account)throw new Error('Account recovery is available when Appwrite is connected.');await account.createRecovery({email,url:`${location.origin}/auth/recover`});}
export async function verifyContact(userId:string,secret:string){if(!account)throw new Error('Appwrite is not connected.');await account.updateVerification({userId,secret});try{await request('/session',{});}catch{/* The email is verified even when the link opens outside the signed-in browser. */}}
export async function resetPassword(userId:string,secret:string,password:string){if(!account)throw new Error('Appwrite is not connected.');await account.updateRecovery({userId,secret,password});}
export async function securityInfo(){if(!account)return null;const [user,sessions]=await Promise.all([account.get(),account.listSessions()]);return {user,sessions:sessions.sessions};}
export async function beginMfa(){if(!account)throw new Error('MFA enrolment requires Appwrite. Synthetic officer profiles simulate MFA.');return account.createMfaAuthenticator({type:AuthenticatorType.Totp});}
export async function confirmMfa(otp:string){if(!account)throw new Error('Appwrite is not connected.');await account.updateMfaAuthenticator({type:AuthenticatorType.Totp,otp});await account.updateMFA({mfa:true});}
export async function challengeMfa(otp?:string,challengeId?:string){if(!account)throw new Error('Appwrite is not connected.');if(challengeId&&otp){await account.updateMfaChallenge({challengeId,otp});await request('/session',{});return '';}return (await account.createMfaChallenge({factor:AuthenticationFactor.Totp})).$id;}
export async function downloadReport(){const data=await request('/export');const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='cbs-authorized-report.json';link.click();URL.revokeObjectURL(url);}
export async function uploadEvidence(file:File,targetType:'CASE'|'PROJECT',targetId:string,clientRequestId:string){
  if(file.size>4*1024*1024)throw new Error('Files must be no larger than 4 MiB.');
  const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return request<import('../../shared/model').Evidence>('/evidence',{targetType,targetId,filename:file.name,mime:file.type,contentBase64:btoa(binary),clientRequestId});
}
export async function downloadEvidence(evidence:import('../../shared/model').Evidence){
  const {token}=await request<{token:string}>(`/evidence/${evidence.id}/download-token`,{});
  const response=await fetch(`/api/v1/evidence/${evidence.id}/download?token=${encodeURIComponent(token)}`,{headers:await authHeaders(),credentials:'same-origin'});
  if(!response.ok){const data=await response.json();throw new Error(data.error?.message??'Evidence download failed.');}
  const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=evidence.filename;link.click();URL.revokeObjectURL(url);
}

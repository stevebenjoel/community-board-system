import { createStore } from '../server/store.ts';
import { produceReminders } from '../server/reminders.ts';
import { appendAudit } from '../server/domain.ts';
const store=createStore();const count=await store.transaction(s=>{const n=produceReminders(s);if(n)appendAudit(s,{id:'system-reminders',name:'Reminder service',email:'',verified:true,mfa:true},'reminders.delivered',String(n),s.geos.find(g=>g.type==='COUNTRY')?.id??'');return n;});store.close();console.log(`${count} new private in-app reminder(s) created.`);

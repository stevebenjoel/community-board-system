import { useEffect, useId, useState } from 'react';
import { useCBS } from './context';
import { request } from './lib/api';

export function CommunitySelect({name,value,draft={},required=true}:{name:string;value?:string|number;draft?:Record<string,string>;required?:boolean}){
  const {w}=useCBS(),id=useId();
  const initial=w.geos.find(geo=>geo.id===value&&geo.type==='COMMUNITY');
  const ward=initial?w.geos.find(geo=>geo.id===initial.parentId):undefined;
  const lga=ward?w.geos.find(geo=>geo.id===ward.parentId):undefined;
  const [stateId,setStateId]=useState(draft[name+'-state']??lga?.parentId??'');
  const [lgaId,setLgaId]=useState(draft[name+'-lga']??lga?.id??'');
  const [wardId,setWardId]=useState(draft[name+'-ward']??ward?.id??'');
  const [communityId,setCommunityId]=useState(String(value??''));
  const [result,setResult]=useState<{wardId:string;locations:{id:string;name:string}[];error?:boolean}>();
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!wardId)return;
    let active=true;
    request<{id:string;name:string}[]>('/wards/'+wardId+'/communities')
      .then(locations=>{if(active)setResult({wardId,locations});})
      .catch(()=>{if(active)setResult({wardId,locations:[],error:true});});
    return ()=>{active=false;};
  },[wardId,retry]);
  const current=result?.wardId===wardId?result:undefined;
  const locations=current?.locations??[];
  return <fieldset className="report-community">
    <legend>Community{required?' *':''}</legend>
    <div className="geo-selects">
      <label htmlFor={id+'-state'}>State / FCT
        <select id={id+'-state'} name={name+'-state'} value={stateId} required={required} onChange={event=>{
          setStateId(event.target.value);setLgaId('');setWardId('');setCommunityId('');
        }}><option value="">Select state / FCT</option>{w.geos.filter(geo=>geo.type==='STATE').map(geo=><option key={geo.id} value={geo.id}>{geo.name}</option>)}</select>
      </label>
      <label htmlFor={id+'-lga'}>LGA / Area council
        <select id={id+'-lga'} name={name+'-lga'} value={lgaId} required={required} disabled={!stateId} onChange={event=>{
          setLgaId(event.target.value);setWardId('');setCommunityId('');
        }}><option value="">Select LGA / Area council</option>{w.geos.filter(geo=>geo.type==='LGA'&&geo.parentId===stateId).map(geo=><option key={geo.id} value={geo.id}>{geo.name}</option>)}</select>
      </label>
      <label htmlFor={id+'-ward'}>Ward
        <select id={id+'-ward'} name={name+'-ward'} value={wardId} required={required} disabled={!lgaId} onChange={event=>{
          setWardId(event.target.value);setCommunityId('');
        }}><option value="">Select ward</option>{w.geos.filter(geo=>geo.type==='WARD'&&geo.parentId===lgaId).map(geo=><option key={geo.id} value={geo.id}>{geo.name}</option>)}</select>
      </label>
      <label htmlFor={id+'-community'}>Community / Settlement
        <select id={id+'-community'} name={name} value={locations.some(geo=>geo.id===communityId)?communityId:''} required={required} onChange={event=>setCommunityId(event.target.value)}>
          <option value="">{!wardId?'Select a ward first':!current?'Loading communities…':locations.length?'Select community':'No matched communities available for this ward'}</option>
          {locations.map(geo=><option key={geo.id} value={geo.id}>{geo.name}</option>)}
        </select>
      </label>
    </div>
    {current?.error&&<p role="alert">Communities could not be loaded. <button type="button" className="text-button" onClick={()=>{setResult(undefined);setRetry(value=>value+1);}}>Retry</button></p>}
  </fieldset>;
}

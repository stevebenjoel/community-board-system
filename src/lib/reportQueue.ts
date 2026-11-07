export interface ReportSetup { owner: string; jurisdiction: string; community: string }
export interface QueuedReport {
  id: string;
  owner: string;
  payload: { clientRequestId:string; category:string; jurisdiction:string; title:string; description:string; location:string; urgency:string };
  audio?: Blob;
  caseId?: string;
}

async function db(){
  return new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open('cbs-private-reporting',1);
    request.onupgradeneeded=()=>{
      request.result.createObjectStore('setup');
      request.result.createObjectStore('reports',{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function access<T>(store:string,mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>){
  const database=await db();
  try{
    return await new Promise<T>((resolve,reject)=>{
      const transaction=database.transaction(store,mode);
      const request=operation(transaction.objectStore(store));
      transaction.oncomplete=()=>resolve(request.result);
      transaction.onabort=()=>reject(transaction.error);
      transaction.onerror=()=>reject(transaction.error);
    });
  }finally{database.close();}
}
export const loadSetup=()=>access<ReportSetup|undefined>('setup','readonly',store=>store.get('active'));
export const saveSetup=(setup:ReportSetup)=>access('setup','readwrite',store=>store.put(setup,'active'));
export const clearSetup=()=>access('setup','readwrite',store=>store.delete('active'));
export const listReports=async(owner:string)=>(await access<QueuedReport[]>('reports','readonly',store=>store.getAll())).filter(report=>report.owner===owner);
export const saveReport=(report:QueuedReport)=>access('reports','readwrite',store=>store.put(report));
export const deleteReport=(id:string)=>access('reports','readwrite',store=>store.delete(id));

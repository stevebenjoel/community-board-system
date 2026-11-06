import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { basename } from 'node:path';
import { z } from 'zod';
for(const file of ['.env.local','.env']) if(existsSync(file))loadEnvFile(file);
const schema=z.object({
  NODE_ENV:z.enum(['development','test','production']).default('development'),
  CBS_MODE:z.enum(['synthetic','appwrite']).default('synthetic'),
  CBS_TESTING_MODE:z.enum(['true','false']).default('false').transform(value=>value==='true'),
  PORT:z.coerce.number().int().min(1).max(65535).default(3001),
  HOST:z.string().default('127.0.0.1'),
  APP_ORIGIN:z.string().url().default('http://127.0.0.1:5173'),
  APPWRITE_ENDPOINT:z.string().optional(),APPWRITE_PROJECT_ID:z.string().optional(),APPWRITE_API_KEY:z.string().optional(),APPWRITE_PROVISIONING_KEY:z.string().optional(),APPWRITE_DATABASE_ID:z.string().default('cbs'),APPWRITE_DATA_KEY:z.string().optional(),
  CBS_DB_PATH:z.string().default('.data/cbs.sqlite'),
  APPWRITE_EVIDENCE_BUCKET_ID:z.string().default('cbs_evidence'),
  CBS_CLAMAV_HOST:z.string().optional(),CBS_CLAMAV_PORT:z.coerce.number().int().min(1).max(65535).default(3310),
  CBS_REMINDER_INTERVAL_MS:z.coerce.number().int().min(60000).default(900000),
});
export const config=schema.parse(process.env);
const provisioning=['database.ts','grant.ts'].includes(basename(process.argv[1]??''));
export const appwriteKey=provisioning?config.APPWRITE_PROVISIONING_KEY:config.APPWRITE_API_KEY;
if(config.NODE_ENV==='production'&&config.CBS_MODE!=='appwrite')throw new Error('Production requires CBS_MODE=appwrite. Synthetic mode is loopback-only.');
if(config.CBS_MODE==='synthetic'&&!['127.0.0.1','localhost','::1'].includes(config.HOST))throw new Error('Synthetic mode can bind only to loopback.');
if(config.CBS_MODE==='appwrite'){
  for(const key of ['APPWRITE_ENDPOINT','APPWRITE_PROJECT_ID','APPWRITE_DATA_KEY'] as const)if(!config[key])throw new Error(`${key} is required for Appwrite mode.`);
  if(!appwriteKey)throw new Error(provisioning?'APPWRITE_PROVISIONING_KEY is required for database provisioning.':'APPWRITE_API_KEY runtime credential is required for Appwrite mode.');
  if(Buffer.from(config.APPWRITE_DATA_KEY!,'base64').length!==32)throw new Error('APPWRITE_DATA_KEY must be a base64 encoded 32-byte key.');
  const endpoint=new URL(config.APPWRITE_ENDPOINT!);
  if(config.NODE_ENV==='production'&&endpoint.protocol!=='https:')throw new Error('Production Appwrite requires HTTPS.');
}

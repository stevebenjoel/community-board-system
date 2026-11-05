import { spawnSync } from 'node:child_process';
import { existsSync,copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
const destination=resolve('apps/mobile');
if(existsSync(destination)){console.error('apps/mobile already exists. Preserving it; follow mobile/README.md for manual setup.');process.exit(1);}
const executable=process.platform==='win32'?'pnpm.cmd':'pnpm';
function run(args,cwd){const result=spawnSync(executable,args,{cwd,stdio:'inherit',shell:process.platform==='win32'});if(result.status!==0)process.exit(result.status??1);}
run(['dlx','create-expo-app@latest','apps/mobile','--template','blank-typescript','--no-install']);
copyFileSync('mobile/App.tsx',`${destination}/App.tsx`);
run(['install'],destination);
run(['exec','expo','install','react-native-appwrite','expo-file-system','react-native-url-polyfill','expo-secure-store','expo-crypto'],destination);
console.log('Expo client generated with compatible packages. Add the public endpoint configuration described in mobile/README.md and run pnpm start in apps/mobile.');

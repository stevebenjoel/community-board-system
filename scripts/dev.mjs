import { spawn } from 'node:child_process';
const children=[spawn(process.execPath,['--import','tsx','--watch','server/index.ts'],{stdio:'inherit'}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1'],{stdio:'inherit'})];
for(const child of children)child.on('exit',code=>{for(const other of children)if(other!==child)other.kill();process.exit(code??0);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{for(const child of children)child.kill();process.exit(0);});

import { readdirSync,readFileSync } from 'node:fs';
const problems=[];
function scan(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;if(entry.isDirectory())scan(path);else if(/\.(ts|tsx)$/.test(path)){const source=readFileSync(path,'utf8');if(/\b(?:as any|: any|@ts-ignore)\b/.test(source))problems.push(`${path}: unsafe TypeScript escape`);if(/console\.log\(/.test(source)&&path.startsWith('src/'))problems.push(`${path}: browser console output`);}}}
for(const folder of ['src','shared','server'])scan(folder);
if(problems.length){console.error(problems.join('\n'));process.exit(1);}console.log('Source policy checks passed (strict typing escapes and browser logging). TypeScript validates the full source separately.');

import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { commands } from '../server/domain.ts';
import { helpTopics,helpUpdated,featureIdeas } from '../src/content/help.ts';

export function validateHelp() {
  const ids=new Set<string>();
  const covered=new Set<string>();
  for(const topic of helpTopics){
    if(ids.has(topic.id))throw new Error(`Duplicate help topic: ${topic.id}`);ids.add(topic.id);
    if(!topic.summary.trim()||!topic.steps.length||!topic.questions.length)throw new Error(`FAQ and documentation both need content for ${topic.id}.`);
    for(const item of topic.questions)if(!item.question.trim()||!item.answer.trim())throw new Error(`Incomplete FAQ for ${topic.id}.`);
    for(const action of topic.commands){if(!Object.hasOwn(commands,action))throw new Error(`Help references unknown command: ${action}`);if(covered.has(action))throw new Error(`Command documented in more than one primary topic: ${action}`);covered.add(action);}
  }
  const missing=Object.keys(commands).filter(action=>!covered.has(action));
  if(missing.length)throw new Error(`Update FAQ and Documentation together in src/content/help.ts for: ${missing.join(', ')}.`);
  if(featureIdeas.length<3)throw new Error('Keep at least three optional feature ideas for the owner to choose from.');
  if(new Set(featureIdeas.map(i=>i.id)).size!==featureIdeas.length)throw new Error('Feature idea IDs must be unique.');
}
export function generatedHelp(){
  const header=`Reviewed ${helpUpdated}. Generated from src/content/help.ts. Edit the shared source, then run pnpm help:sync.\n`;
  const faq=`# CBS — Frequently Asked Questions\n\n${header}\n${helpTopics.map(t=>`## ${t.title}\n\n${t.questions.map(q=>`### ${q.question}\n\n${q.answer}`).join('\n\n')}\n\nFull workflow: /documentation#guide-${t.id}`).join('\n\n')}\n`;
  const guide=`# CBS — User Documentation\n\n${header}\n${helpTopics.map(t=>`## ${t.title}\n\nAudience: ${t.audience}\n\n${t.summary}\n\n${t.steps.map((s,i)=>`${i+1}. ${s}`).join('\n\n')}\n\n${t.notes.map(n=>`Current boundary: ${n}`).join('\n\n')}\n\nOpen in CBS: ${t.route}`).join('\n\n')}\n`;
  return new Map([['docs/FAQ.md',faq],['docs/USER_GUIDE.md',guide]]);
}
export function checkHelp(){validateHelp();for(const [path,expected] of generatedHelp()){let actual='';try{actual=readFileSync(path,'utf8');}catch{/* Report the actionable sync command below. */}if(actual!==expected)throw new Error(`${path} is out of sync. Run pnpm help:sync to regenerate both help manuals.`);}}
if(resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
  validateHelp();
  if(process.argv[2]==='sync'){mkdirSync('docs',{recursive:true});for(const [path,text] of generatedHelp())writeFileSync(path,text);console.log('FAQ and Documentation regenerated together from the shared help source.');}
  else {checkHelp();console.log('FAQ/Documentation parity and workflow coverage passed.');}
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHelp,generatedHelp,validateHelp } from '../scripts/help.ts';
import { helpTopics,featureIdeas } from '../src/content/help.ts';
test('every workflow has simultaneous FAQ and documentation coverage',()=>{assert.doesNotThrow(validateHelp);assert.doesNotThrow(checkHelp);});
test('both manuals share all topics and disclose current integration limits',()=>{const output=generatedHelp(),faq=output.get('docs/FAQ.md')!,guide=output.get('docs/USER_GUIDE.md')!;for(const topic of helpTopics){assert(faq.includes(`## ${topic.title}`));assert(guide.includes(`## ${topic.title}`));assert(guide.includes(topic.summary));}assert(faq.includes('quarantined'));assert(guide.includes('Appwrite'));assert(guide.includes('independent'));});
test('owner has at least three distinct optional additions',()=>{assert(featureIdeas.length>=3);assert.equal(new Set(featureIdeas.map(i=>i.id)).size,featureIdeas.length);for(const idea of featureIdeas){assert(idea.request.length>20);assert(idea.benefit.length>20);}});

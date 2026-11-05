import { test,expect } from '@playwright/test';

test('resident tour persists across navigation and can pause and restart',async({page})=>{
  await page.goto('/walkthrough');await page.getByLabel('Choose synthetic test profile').selectOption({label:'Ada Okafor · Resident'});
  const card=page.locator('.tour-card').filter({hasText:'Your community journey'});
  await card.getByRole('button',{name:'Restart',exact:true}).isVisible().then(async visible=>{if(visible)await card.getByRole('button',{name:'Restart',exact:true}).click();else await card.getByRole('button',{name:'Start walkthrough',exact:true}).click();});
  const guide=page.getByRole('complementary',{name:'Your community journey walkthrough'});await expect(guide).toBeVisible();
  await guide.getByRole('button',{name:'Next step',exact:true}).click();await expect(page).toHaveURL(/\/community$/);await expect(guide.getByRole('heading',{name:'Find your community',exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('complementary',{name:'Your community journey walkthrough'})).toBeVisible();
  await page.getByRole('button',{name:'Pause for now',exact:true}).click();await expect(page.getByRole('complementary',{name:'Your community journey walkthrough'})).toHaveCount(0);
});

test('case vault stores synthetic PDF in quarantine when no real scanner is configured',async({page})=>{
  await page.goto('/cases');await page.getByLabel('Choose synthetic test profile').selectOption({label:'Ada Okafor · Resident'});
  await page.getByRole('button',{name:'Community water point needs repair',exact:true}).click();
  const vault=page.getByRole('region',{name:'Private evidence vault'});
  await vault.getByLabel('Attach a photograph or document').setInputFiles({name:'synthetic-browser-evidence.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\nSYNTHETIC browser evidence\n%%EOF')});
  await vault.getByRole('button',{name:'Upload private evidence',exact:true}).click();
  const file=vault.locator('.evidence-file').filter({hasText:'synthetic-browser-evidence.pdf'}).last();await expect(file.getByText('Quarantined',{exact:true})).toBeVisible();await expect(file.getByRole('button',{name:'Download',exact:true})).toBeDisabled();
});

test('coordinator deadline is visible in the assigned monitor action queue',async({page})=>{
  await page.goto('/cases');await page.getByLabel('Choose synthetic test profile').selectOption({label:'Chidi Bello · Lga Coordinator'});await page.getByRole('button',{name:'Community water point needs repair',exact:true}).click();
  const control=page.locator('.deadline-control');await control.getByRole('button').click();const dialog=page.getByRole('dialog');const when=new Date(Date.now()+3600000);const local=new Date(when.getTime()-when.getTimezoneOffset()*60000).toISOString().slice(0,16);
  await dialog.getByLabel('Action deadline (your device timezone)').fill(local);await dialog.getByLabel('Reason and expected action').fill('SYNTHETIC browser test: complete the assessment follow-up.');await dialog.getByRole('button',{name:'Save record',exact:true}).click();await expect(dialog).not.toBeVisible();
  await page.getByLabel('Choose synthetic test profile').selectOption({label:'Zainab Ibrahim · Board Member'});await page.goto('/actions');await expect(page.getByRole('button',{name:'Community water point needs repair',exact:true})).toBeVisible();
});

import { test,expect } from '@playwright/test';

test('public FAQ search and handbook links explain the same workflow',async({page})=>{
  await page.goto('/faq');
  await page.getByRole('textbox',{name:'Search questions, roles, reports, or projects…'}).fill('approved minutes');
  const question=page.locator('summary').filter({hasText:'Can approved minutes be edited?'});
  await expect(question).toBeVisible();
  await question.click();
  await expect(page.getByText('No silent edits are allowed.',{exact:false})).toBeVisible();
  await page.getByRole('link',{name:'Read the step-by-step guide',exact:true}).click();
  await expect(page).toHaveURL(/\/documentation#guide-meetings$/);
  await expect(page.getByRole('heading',{name:'Meetings, quorum, votes & minutes',exact:true})).toBeVisible();
});

test('feature ideas allow one, several, all, or no selections without starting a build',async({page})=>{
  await page.goto('/feature-ideas');
  await page.getByRole('checkbox',{name:'Select Board review inbox',exact:true}).check();
  const request=page.getByLabel('Prepared feature request for this chat');
  await expect(request).toHaveValue(/scoped board review inbox/);
  await expect(request).not.toHaveValue(/formal minutes and resolution amendments/);
  await page.getByRole('button',{name:'Select all three',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Select Formal minutes & resolution amendments',exact:true})).toBeChecked();
  await expect(request).toHaveValue(/all of these CBS additions/);
  await page.getByRole('checkbox',{name:'Select Formal minutes & resolution amendments',exact:true}).uncheck();
  await expect(request).not.toHaveValue(/formal minutes and resolution amendments/);
  await page.getByRole('button',{name:'Clear selection',exact:true}).click();
  await expect(request).toHaveCount(0);
});

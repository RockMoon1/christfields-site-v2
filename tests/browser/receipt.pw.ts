import {test, expect} from '@playwright/test';
const token='a'.repeat(64);
const saved={id:'synthetic-reference',form_slug:'synthetic-receipt-test',created_at:'2026-11-04T22:30:47.466Z',interest:'no',available:['2026-11-07'],unavailable:['2026-11-08']};

test('receipt requires explicit confirmation and replaces button with accessible success',async({page})=>{
 let calls=0; let release!:()=>void; const pending=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/forms/receipt',async route=>{calls++;expect(route.request().postDataJSON()).toEqual({token});await pending;await route.fulfill({json:{receipt:saved}});});
 await page.goto('/forms.html?receipt#'+token);
 const button=page.getByRole('button',{name:'Confirm and view receipt'});
 await expect(button).toBeEnabled();expect(calls).toBe(0);
 await expect(page.getByText('synthetic-reference')).toHaveCount(0);
 expect(new URL(page.url()).hash).toBe('');
 await expect(page.getByText(/Forwarding it shares access/)).toBeVisible();
 await button.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('button',{name:'Checking…'})).toBeDisabled();
 await page.keyboard.press('Enter');expect(calls).toBe(1);release();
 const heading=page.getByRole('heading',{name:'Email confirmed'});
 await expect(heading).toBeVisible();await expect(heading).toBeFocused();
 await expect(page.getByRole('button')).toHaveCount(0);
 await expect(page.getByRole('status')).toContainText('not your identity, attendance or a ticket');
 await expect(page.locator('time')).toHaveText('November 4, 2026 at 10:30 PM UTC');
 await expect(page.locator('time')).toHaveAttribute('datetime',saved.created_at);
 await expect(page.getByText('2026-11-07',{exact:true})).toBeVisible();
 await page.keyboard.press('Enter');expect(calls).toBe(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/receipt-success-mobile.png',fullPage:true});
});

test('expired receipt shows an alert and cannot repeat confirmation',async({page})=>{
 await page.route('**/api/forms/receipt',route=>route.fulfill({status:404,json:{error:'This receipt link is invalid or expired.'}}));
 await page.goto('/forms.html?receipt#'+token);await page.getByRole('button',{name:'Confirm and view receipt'}).click();
 await expect(page.getByRole('alert')).toHaveText('This receipt link is invalid or expired.');
 await expect(page.getByRole('button')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Email confirmed'})).toHaveCount(0);
});

test('network failure allows a retry with the same token without false success',async({page})=>{
 const bodies:unknown[]=[];await page.route('**/api/forms/receipt',route=>{bodies.push(route.request().postDataJSON());return bodies.length===1?route.abort():route.fulfill({json:{receipt:saved}});});
 await page.goto('/forms.html?receipt#'+token);await page.getByRole('button',{name:'Confirm and view receipt'}).click();
 await expect(page.getByRole('alert')).toContainText('Check your connection');
 await expect(page.getByRole('heading',{name:'Email confirmed'})).toHaveCount(0);
 await page.getByRole('button',{name:'Confirm and view receipt'}).click();await expect(page.getByRole('heading',{name:'Email confirmed'})).toBeVisible();
 expect(bodies).toEqual([{token},{token}]);await expect(page.getByRole('alert')).toHaveCount(0);
});

test('server failure cannot display a receipt and stays retryable',async({page})=>{
 await page.route('**/api/forms/receipt',route=>route.fulfill({status:503,json:{error:'Receipt unavailable.',receipt:saved}}));
 await page.goto('/forms.html?receipt#'+token);await page.getByRole('button',{name:'Confirm and view receipt'}).click();
 await expect(page.getByRole('alert')).toHaveText('Receipt unavailable.');await expect(page.getByRole('button',{name:'Confirm and view receipt'})).toBeEnabled();
 await expect(page.getByText('synthetic-reference')).toHaveCount(0);
});

test('missing private link explains next step without a dead confirmation button',async({page})=>{
 await page.goto('/forms.html?receipt');await expect(page.getByRole('status')).toContainText('Open the complete private link');await expect(page.getByRole('button')).toHaveCount(0);
});

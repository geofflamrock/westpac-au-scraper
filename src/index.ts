import { Page } from 'puppeteer';

export type Credentials = {
  username: string;
  password: string;
};

export async function login(
  page: Page,
  credentials: Credentials
): Promise<void> {
  await page.goto(
    'https://banking.westpac.com.au/wbc/banking/handler?TAM_OP=login&segment=personal&logout=false'
  );

  await page.type('#fakeusername', credentials.username);
  await page.type('#password', credentials.password);
  await page.click('#signin');

  await page.waitForNavigation();

  // const alert = await page.$(
  //   '#alertManagerArea .alert.alert-error .alert-icon'
  // );

  // if (alert !== null) {
  //   throw new Error(await alert.getProperty('value'));
  // }

  // TODO: Check if error exists and return it
}

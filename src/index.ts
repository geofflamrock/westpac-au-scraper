import { Page } from 'puppeteer';

export async function login(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto(
    'https://banking.westpac.com.au/wbc/banking/handler?TAM_OP=login&segment=personal&logout=false'
  );

  await page.type('#fakeusername', username);
  await page.type('#password', password);
  await page.click('#signin');

  await page.waitForTimeout(1000);

  const alert = await page.$('.alert.alert-error .alert-icon');

  if (alert !== null) {
    const alertMessage: string = (
      await page.evaluate(element => element.textContent, alert)
    ).trim();
    if (
      alertMessage.startsWith(
        "The details entered don't match those on our system"
      )
    )
      throw new Error("The details entered don't match those on our system");
    else {
      throw new Error(alertMessage);
    }
  }

  await page.waitForNavigation();
}

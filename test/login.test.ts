import puppeteer from 'puppeteer';
import { login } from '../src/login';

describe('Login', () => {
  test('Login using invalid format username throws error', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
      await login(page, 'afakeusername', 'notarealpassword');
    } catch (e) {
      expect(e).toEqual(
        new Error('Please enter your Customer ID using a valid format')
      );
      return;
    } finally {
      await browser.close();
    }

    throw new Error('Invalid username format did not throw error');
  });

  test('Login using invalid credentials throws error', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
      await login(page, '00000000', '123456');
    } catch (e) {
      expect(e).toEqual(
        new Error("The details entered don't match those on our system")
      );
      return;
    } finally {
      await browser.close();
    }

    throw new Error('Invalid credentials did not throw error');
  });

  test.skip('Login using valid credentials works', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
      await login(
        page,
        process.env.WESTPAC_USERNAME || '',
        process.env.WESTPAC_PASSWORD || ''
      );
    } finally {
      await browser.close();
    }
  });
});

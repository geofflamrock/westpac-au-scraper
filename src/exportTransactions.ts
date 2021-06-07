import { Page } from 'puppeteer';
import { format } from 'date-fns';
import path from 'path';
import tmp from 'tmp';
import fs from 'fs';

export enum ExportFormat {
  Ofx,
}

function getFileTypeSelector(exportFormat: ExportFormat): string {
  switch (exportFormat) {
    case ExportFormat.Ofx: {
      return '#File_type_3';
    }
    default: {
      throw new Error('Unknown export format');
    }
  }
}

export const getWestpacTransactions = async (
  page: Page,
  accountName: string,
  startDate: Date,
  endDate: Date,
  exportFormat: ExportFormat = ExportFormat.Ofx
): Promise<string> => {
  await page.goto(
    'https://banking.westpac.com.au/secure/banking/reportsandexports/exportparameters/2/'
  );

  const startDateFormatted = format(startDate, 'dd/MM/yyyy');
  const endDateFormatted = format(endDate, 'dd/MM/yyyy');

  await page.click('#DateRange_StartDate', { clickCount: 3 });
  await page.type('#DateRange_StartDate', startDateFormatted);

  await page.click('#DateRange_EndDate', { clickCount: 3 });
  await page.type('#DateRange_EndDate', endDateFormatted);

  await page.type('#Accounts_1', accountName);
  await page.waitForTimeout(2000);
  await page.waitForSelector('.autosuggest-suggestions:first-child');
  await page.click('.autosuggest-suggestions:first-child');

  await page.waitForTimeout(2000);
  const fileTypeSelector = getFileTypeSelector(exportFormat);
  await page.waitForSelector(fileTypeSelector);
  await page.click(fileTypeSelector);

  const tempDir = tmp.dirSync();
  console.log(`Exporting transaction file to '${tempDir.name}'`);

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: tempDir.name,
  });
  await page.click('.btn-actions > .btn.export-link');

  let transactionsFile = '';

  while (true) {
    const downloadDirFiles = fs.readdirSync(tempDir.name);

    if (downloadDirFiles.length > 0) {
      transactionsFile = path.join(tempDir.name, downloadDirFiles[0]);
      break;
    }
    await page.waitForTimeout(1000);
  }

  return transactionsFile;
};
import { Page } from 'puppeteer';
import { format, addMilliseconds } from 'date-fns';
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

export const exportTransactions = async (
  page: Page,
  accountName: string,
  startDate?: Date,
  endDate?: Date,
  exportFormat: ExportFormat = ExportFormat.Ofx,
  options: {
    debug?: boolean;
    downloadTimeoutInMs?: number;
  } = {
    debug: false,
    downloadTimeoutInMs: 30000,
  }
): Promise<string> => {
  await page.goto(
    'https://banking.westpac.com.au/secure/banking/reportsandexports/exportparameters/2/'
  );

  if (startDate !== undefined) {
    const startDateFormatted = format(startDate, 'dd/MM/yyyy');

    if (options.debug)
      console.log(`Setting start date '${startDateFormatted}'`);

    await page.click('#DateRange_StartDate', { clickCount: 3 });
    await page.type('#DateRange_StartDate', startDateFormatted);
  }

  if (endDate !== undefined) {
    const endDateFormatted = format(endDate, 'dd/MM/yyyy');

    if (options.debug) console.log(`Setting end date '${endDateFormatted}'`);

    await page.click('#DateRange_EndDate', { clickCount: 3 });
    await page.type('#DateRange_EndDate', endDateFormatted);
  }

  if (options.debug) console.log(`Selecting account '${accountName}'`);

  await page.type('#Accounts_1', accountName);
  await page.waitForTimeout(2000);
  await page.waitForSelector('.autosuggest-suggestions:first-child');
  await page.click('.autosuggest-suggestions:first-child');

  const fileTypeSelector = getFileTypeSelector(exportFormat);

  if (options.debug)
    console.log(`Setting export format '${ExportFormat[exportFormat]}'`);

  await page.waitForTimeout(2000);
  await page.waitForSelector(fileTypeSelector);
  await page.click(fileTypeSelector);

  const tempDir = tmp.dirSync();

  if (options.debug) console.log(`Exporting transactions to '${tempDir.name}'`);

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: tempDir.name,
  });
  await page.click('.btn-actions > .btn.export-link');

  let transactionsFile = '';

  const downloadTimeoutTime = addMilliseconds(
    new Date(),
    options.downloadTimeoutInMs || 300000 // 5 minutes
  );

  while (true) {
    if (options.debug)
      console.log(`Checking for downloaded file in '${tempDir.name}'`);

    const downloadDirFiles = fs.readdirSync(tempDir.name);

    if (downloadDirFiles.length > 0) {
      transactionsFile = path.join(tempDir.name, downloadDirFiles[0]);
      break;
    }

    if (new Date() > downloadTimeoutTime) {
      throw new Error('Transaction file download has timed out');
    }

    await page.waitForTimeout(1000);
  }

  return transactionsFile;
};

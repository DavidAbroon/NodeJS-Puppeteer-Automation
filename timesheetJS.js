const puppeteer = require('puppeteer-core');
const url = 'https://payroll.ascenderpay.com/ereap-wss/faces/app/WJ0000.jspx';
const prompt = require('prompt');
const chromePaths = require('chrome-paths');

async function timesheetAutomate () {

    // Create browser session and open    
    const browser = await puppeteer.launch({ headless: false,
        args: [`--window-size=1920,1280`],
        defaultViewport: {
          width:1920,
          height:1080
        },
        executablePath: chromePaths.chrome });
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'networkidle0'});

    //Prompt for user input and assign to variables
    prompt.start();
    const credentials = await new Promise((resolve, reject) => {
        prompt.get(['username', 'password', 'startTime', 'endTime', 'breakTime', 'comments'], (error, result) => {
          resolve(result);
        });
      });
    const username = credentials.username;
    const password = credentials.password;
    const startTimeInput = credentials.startTime;
    const endTimeInput = credentials.endTime;
    const breakInput = credentials.breakTime;
    const commentsInput = credentials.comments;

    //Enter credentials and click Login
    await page.type('#pt1\\:pt_s2\\:wssUsernameField\\:\\:content', username);
    await page.type('#pt1\\:pt_s2\\:wssPasswordField\\:\\:content', password);
    await page.click('#pt1\\:pt_s2\\:wssLoginButton');
    console.log('Login successful')

    //Click on My FlexiTime > My FlexiTime
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.click('#pt1\\:MWJ0000_NAVTIMEK > div');
    await page.click('#pt1\\:MNAVTIMEK_NAVW01');

    //Click on button with "Edit" in iframe
    await page.waitForNavigation({waitUntil: 'load'});
    await page.waitForTimeout(2000);
    console.log('Edit page has loaded');
    const elementHandle = await page.$('div#pt1\\:r1\\:0\\:pt1\\:Main iframe');
    const frame = await elementHandle.contentFrame();
    await frame.waitForSelector('body > p:nth-child(4) > table > tbody > tr:nth-child(2) > td:nth-child(3) > a');
    const edit = await frame.$('body > p:nth-child(4) > table > tbody > tr:nth-child(2) > td:nth-child(3) > a');
    await edit.click();

    //Timesheet page automating
    const elementHandle2 = await page.$('div#pt1\\:r1\\:0\\:pt1\\:Main iframe');
    const frame2 = await elementHandle2.contentFrame();
    await frame2.waitForSelector('[name="PI_START_TIME"]');

    const startTime = await frame2.$$('[name="PI_START_TIME"]');
    for (let i = 0; i < startTime.length; i++) {
        if (startTime[i] !== null) {    
            await startTime[i].type(startTimeInput);   
        }
    }

    const endTime = await frame2.$$('[name="PI_END_TIME"]');
    for (let i = 0; i < endTime.length; i++) {
        if (endTime[i] !== null) {    
            await endTime[i].type(endTimeInput);
        }
    }

    const breakMin = await frame2.$$('[name="PI_BREAK"]');
    let breakMinValue = await frame2.$$eval("[name='PI_BREAK']", el => el.map(x => x.getAttribute("value")));
    for (let i = 0; i < breakMin.length; i++) {
        if (breakMinValue[i] == null) {
            await breakMin[i].type(breakInput);
        }
    }

    const comments = await frame2.$$('[name="PI_COMMENTS"]');
    let commentsValue = await frame2.$$eval("[name='PI_COMMENTS']", el => el.map(x => x.getAttribute("value")));
    for (let i = 0; i < comments.length; i++) {
        if (commentsValue[i] == null) {    
            await comments[i].type(commentsInput);
        }
    }

    await page.waitForNavigation();
    await page.waitForTimeout(2000);
    browser.close();
}
timesheetAutomate();

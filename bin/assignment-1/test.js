/**
 * @license Copyright 2019 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
 'use strict';

 /**
  * @fileoverview Example script for running Lighthouse on an authenticated page.
  * See docs/recipes/auth/README.md for more.
  */
 
 const puppeteer = require('puppeteer');
 const lighthouse = require('lighthouse');
 const { start } = require('repl');
 
 // This port will be used by Lighthouse later. The specific port is arbitrary.
 const PORT = 8041;
 
 /**
  * @param {import('puppeteer').Browser} browser
  * @param {string} origin
  */
  async function register(browser, origin) {
   const page = await browser.newPage();
   await page.goto(origin);
   await page.waitForSelector('input[id="username"]', {visible: true});
 
   // Fill in and submit login form.
   const userInput = await page.$('input[id="username"]');
   await userInput.type('test');
   const passwordInput = await page.$('input[id="password"]');
   await passwordInput.type('test');
   const passwordInput2 = await page.$('input[id="password2"]');
   await passwordInput2.type('test');
   const emailInput = await page.$('input[id="email"]');
   await emailInput.type('test@test.com');
   await Promise.all([
     // page.$eval('.form', form => form.submit()),
     // CSM: dirty hack to get around the fact that the form is named 'submit' 
     //      so you can't call submit() on it.
     page.$eval('form.form', form => {
       Object.getPrototypeOf(form).submit.call(form);
     }),
     page.waitForNavigation(),
   ]);
 
   await page.close();
 }
 
 /**
  * @param {import('puppeteer').Browser} browser
  * @param {string} origin
  */
 async function login(browser, origin) {
   const page = await browser.newPage();
   await page.goto(origin);
   await page.waitForSelector('input[id="username"]', {visible: true});
 
   // Fill in and submit login form.
   const userInput = await page.$('input[id="username"]');
   await userInput.type('test');
   const passwordInput = await page.$('input[id="password"]');
   await passwordInput.type('test');
   await Promise.all([
     // page.$eval('.form', form => form.submit()),
     // CSM: dirty hack to get around the fact that the form is named 'submit' 
     //      so you can't call submit() on it.
     page.$eval('form.form', form => {
       Object.getPrototypeOf(form).submit.call(form);
     }),
     page.waitForNavigation(),
   ]);
 
   await page.close();
 }
 
 /**
  * @param {puppeteer.Browser} browser
  * @param {string} origin
  */
 async function logout(browser, origin) {
   const page = await browser.newPage();
   await page.goto(`${origin}/logout`);
   await page.close();
 }
 
 async function main() {
   // Direct Puppeteer to open Chrome with a specific debugging port.
   const browser = await puppeteer.launch({
     args: [`--remote-debugging-port=${PORT}`],
     // Optional, if you want to see the tests in action.
     headless: true,
     slowMo: 50,
   });
 
   // Register.
   await register(browser, 'http://localhost:5000/auth/register');
 
   // Setup the browser session to be logged into our site.
   await login(browser, 'http://localhost:5000');
 
   // The local server is running on port 10632.
   const url = 'http://localhost:5000/explore';
   // Direct Lighthouse to use the same port.
   const result = await lighthouse(url, {port: PORT, disableStorageReset: true});
   // Direct Puppeteer to close the browser as we're done with it.
   await browser.close();
 
   // Output the result.
   // console.log(JSON.stringify(result.lhr, null, 2));
 
   // Starting values.
   let startingScores = {};
   startingScores['performance'] = 0.98;
   startingScores['accessibility'] = 0.93;
   startingScores['best-practices'] = 0.93;
   startingScores['seo'] = 0.91;
   startingScores['pwa'] = 0.3;
 
   console.log("Starting scores: ")
   console.log(startingScores);
   console.log("");
 
   let currentScores = {}
   let oneKeyChanged = false;
   
   for (const key in result.lhr['categories']) {
     // console.log(key);
     // console.log(result.lhr['categories'][key]['score'])
     currentScores[key] = result.lhr['categories'][key]['score']
 
     if (result.lhr['categories'][key]['score'] > startingScores[key]) {
       if (key != 'performance') {
         oneKeyChanged = true;
       }
     }
   }
 
   console.log("Current scores: ")
   console.log(currentScores);
   console.log("");
 
   if (!oneKeyChanged) {
     console.log("No change detected in Lighthouse scores.");
     process.exit(1);
   } else {
     console.log("Test passed!");
   }
 }
 
 if (require.main === module) {
   // TODO: could automatically do this setup/teardown
   //       would be pretty easy: just needs to clone the user code, 
   //       start it with the gunicorn command, 
   //       then add the test user either through the flask db schema migrate
   //       or by just clicking the buttons in the UI using puppeteer.
   // 
   console.log("This script assumes that the app is already started and running on port 5000.")
   console.log("");
   console.log("It also assumes that there is a test user with username 'test' and password 'test'.");
   main();
 } else {
   module.exports = {
     register,
     login,
     logout,
   };
 }
#!/usr/bin/env node

import fs from "fs";
import { chromium } from "playwright";
import readline from "readline";
import chalk from "chalk";
import cliProgress from "cli-progress";
import arg from "arg";

/**
 * Reads domains from standard input (stdin).
 * @returns {Promise<string[]>} A promise that resolves to an array of domains.
 */
const readDomainsFromStdin = async () => {
  const domains = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  for await (const line of rl) {
    if (line.trim()) {
      domains.push(line.trim());
    }
  }

  return domains;
};

/**
 * Reads domains from a file.
 * @param {string} filePath - The path to the file containing domains.
 * @returns {Promise<string[]>} A promise that resolves to an array of domains.
 */
const readDomainsFromFile = async (filePath) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const domains = [];
  for await (const line of rl) {
    if (line.trim()) {
      domains.push(line.trim());
    }
  }

  return domains;
};

/**
 * Checks if a domain uses Firebase by analyzing its JavaScript files.
 * @param {string} domain - The domain to check.
 * @returns {Promise<Object>} A promise that resolves to an object containing the domain, an array of Firebase files, and the status.
 */
const checkForFirebase = async (domain) => {
  const browser = await chromium.launch({
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  let firebaseFiles = [];
  let status = "";

  try {
    const response = await page.goto(`http://${domain}`, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    if (!response || response.status() !== 200) {
      status = "HTTP TIMEOUT";
      await browser.close();
      return { domain, firebaseFiles, status };
    }

    const jsHandles = await page.evaluateHandle(() => {
      const scripts = Array.from(document.scripts);
      return scripts.map((script) => script.src);
    });

    const jsUrls = await jsHandles.jsonValue();
    for (let jsUrl of jsUrls) {
      if (jsUrl) {
        const jsResponse = await page.goto(jsUrl, {
          waitUntil: "domcontentloaded",
          timeout: 10000,
        });
        if (jsResponse) {
          const jsContent = await jsResponse.text();
          if (
            jsContent.toLowerCase().includes("firebase") &&
            jsContent.toLowerCase().includes("databaseurl")
          ) {
            firebaseFiles.push(jsUrl);
          }
        }
      }
    }

    status = firebaseFiles.length > 0 ? "FIREBASE" : "NO FIREBASE";
  } catch (error) {
    status = "HTTP TIMEOUT";
  }

  await browser.close();
  return { domain, firebaseFiles, status };
};

/**
 * The main function that processes command line arguments and performs domain checks.
 */
const main = async () => {
  const args = arg({
    "--file": String,
    "--help": Boolean,
    "--domains": String,
    "--show-all": Boolean,
    "-f": "--file",
    "-h": "--help",
    "-d": "--domains",
    "-s": "--show-all",
  });

  if (args["--help"]) {
    console.log("Usage: firebazy [options]");
    console.log("");
    console.log("Options:");
    console.log("  --file, -f    File containing list of domains to check");
    console.log(
      "  --domains, -d List of domains to check, delimited by space, comma, or newline",
    );
    console.log("  --help, -h    Display help message");
    console.log("  --show-all, -s  Show all results, including NO FIREBASE");
    return;
  }

  let domains = [];

  // Check if domains were piped in
  if (process.stdin.isTTY === false) {
    domains = await readDomainsFromStdin();
  } else if (args["--file"]) {
    domains = await readDomainsFromFile(args["--file"]);
  } else if (args["--domains"]) {
    domains = args["--domains"].split(/[\s,]/).map((domain) => domain.trim())
      .filter((domain) => domain);
  } else {
    console.log(
      "Please provide a file or list of domains to check, or pipe the domains list.",
    );
    return;
  }

  if (domains.length === 0) {
    console.log("No domains to check");
    return;
  }

  const showAll = args["--show-all"];

  const progressBar = new cliProgress.SingleBar({
    format: "Progress |" + chalk.cyan("{bar}") +
      "| {percentage}% || {value}/{total} Domains Checked",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });

  progressBar.start(domains.length, 0);

  const checkDomainPromises = domains.map(async (domain) => {
    const result = await checkForFirebase(domain);
    progressBar.increment();
    return result;
  });

  const results = await Promise.all(checkDomainPromises);

  progressBar.stop();

  for (const result of results) {
    if (!showAll && ["NO FIREBASE", "HTTP TIMEOUT"].includes(result.status)) {
      continue;
    }

    const statusText = result.status === "FIREBASE"
      ? chalk.green(`[${result.status}]`)
      : chalk.red(`[${result.status}]`);
    console.log(`${statusText} ${result.domain}`);
    if (result.status === "FIREBASE") {
      for (const file of result.firebaseFiles) {
        console.log(`  - JS file: ${file}`);
      }
    }
  }
};

main();


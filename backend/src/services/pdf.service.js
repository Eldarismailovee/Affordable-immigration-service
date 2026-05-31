import puppeteer from "puppeteer-core";
import env from "../config/env.js";
import { createAsyncLimiter } from "../utils/asyncLimiter.js";
import { escapeHtml } from "../utils/htmlEscape.js";

const CHROMIUM_PATH = env.CHROMIUM_PATH;
const limitPdfGeneration = createAsyncLimiter(1);

export function renderHtmlToPdfBuffer(payload) {
  return limitPdfGeneration(() => renderHtmlToPdfBufferUnsafe(payload));
}

async function renderHtmlToPdfBufferUnsafe({ title, html }) {
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();

      if (url === "about:blank" || url.startsWith("data:")) {
        request.continue();
        return;
      }

      request.abort();
    });

    const fullHtml = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(title || "Document")}</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
              padding: 40px;
              line-height: 1.6;
              font-size: 14px;
            }
            main {
              max-width: 100%;
            }
            h1, h2, h3, h4 {
              color: #111827;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            h1:first-child, h2:first-child, h3:first-child {
              margin-top: 0;
            }
            hr {
              border: none;
              border-top: 1px solid #374151;
              margin: 20px 0;
            }
            p, li, td, th {
              color: #1f2937;
            }
            a {
              color: #1d4ed8;
              text-decoration: underline;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
            }
            th {
              background: #f3f4f6;
            }
            ul, ol {
              padding-left: 1.5em;
            }
          </style>
        </head>
        <body>
          <main>
            ${html || "<p>No content</p>"}
          </main>
        </body>
      </html>
    `;

    await page.setContent(fullHtml, {
      waitUntil: "domcontentloaded",
    });

    await page.emulateMediaType("screen");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

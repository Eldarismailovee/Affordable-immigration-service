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
      <html>
        <head>
          <meta charset="utf-8" />
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
            h1, h2, h3 {
              color: #111827;
              margin-top: 0;
            }
            hr {
              border: none;
              border-top: 1px solid #d1d5db;
              margin: 20px 0;
            }
            p, li, div, span {
              color: #1f2937;
            }
          </style>
        </head>
        <body>
          ${html || "<p>No content</p>"}
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

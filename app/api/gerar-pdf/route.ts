import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { generateProposalHTML, generateFooterHTML } from "@/lib/template";
import { ProposalData } from "@/lib/types";
import { buildPdfFilename } from "@/lib/filename";

export const runtime = "nodejs";
export const maxDuration = 60;

// Caminhos comuns de Chrome/Edge para desenvolvimento local (Windows/macOS),
// onde o binário Linux do @sparticuz/chromium não roda.
function findLocalChrome(): string | null {
  const candidates =
    process.platform === "win32"
      ? [
          `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
          `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
        ]
      : [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          "/usr/bin/google-chrome",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
        ];
  return candidates.find((p) => p && existsSync(p)) ?? null;
}

async function launchBrowser() {
  // 1) Override explícito (qualquer ambiente).
  const explicitPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  // 2) Dev local (Windows/macOS): usa o Chrome/Edge instalado.
  const localPath =
    explicitPath ??
    (process.platform !== "linux" ? findLocalChrome() : null);

  if (localPath) {
    if (!existsSync(localPath)) {
      throw new Error(
        `Navegador não encontrado em "${localPath}". Instale o Google Chrome ou defina PUPPETEER_EXECUTABLE_PATH com o caminho do executável.`,
      );
    }
    return puppeteer.launch({
      executablePath: localPath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  if (process.platform !== "linux") {
    throw new Error(
      "Chrome não encontrado para desenvolvimento local. Instale o Google Chrome ou defina PUPPETEER_EXECUTABLE_PATH no .env.local com o caminho do executável (ex.: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe).",
    );
  }

  // 3) Produção/Docker (Linux): binário empacotado pelo @sparticuz/chromium.
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

export async function POST(req: Request) {
  try {
    const data: ProposalData = await req.json();

    const logoPath = join(process.cwd(), "public", "logo.png");
    const logoBuffer = readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

    const html = generateProposalHTML(data, logoBase64);
    const footerHtml = generateFooterHTML();

    const browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: footerHtml,
      margin: {
        top: "20mm",
        bottom: "22mm",
        left: "20mm",
        right: "20mm",
      },
    });

    await browser.close();

    const filename = buildPdfFilename(data);
    const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    const detalhe = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Falha ao gerar o PDF: ${detalhe}` },
      { status: 500 }
    );
  }
}

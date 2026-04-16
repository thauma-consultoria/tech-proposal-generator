import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { readFileSync } from "fs";
import { join } from "path";
import { generateProposalHTML, generateFooterHTML } from "@/lib/template";
import { ProposalData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const data: ProposalData = await req.json();

    const logoPath = join(process.cwd(), "public", "logo.png");
    const logoBuffer = readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

    const html = generateProposalHTML(data, logoBase64);
    const footerHtml = generateFooterHTML();

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

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

    const safeNumber = data.numero.replace(/[^a-zA-Z0-9]/g, "-");

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: "Falha ao gerar o PDF. Tente novamente." },
      { status: 500 }
    );
  }
}

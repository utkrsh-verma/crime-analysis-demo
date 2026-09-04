import { PDFParse } from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';
import { PoleParser, ParseResult } from './poleParser.js';
import { POLEEntity } from '../types.js';

export interface PdfParseDetails extends ParseResult {
  pageCount: number;
  ocrApplied: boolean;
  rawText: string;
  textSnippet: string;
  metadata: Record<string, any>;
}

export class PdfParser {
  private static geminiClient: GoogleGenAI | null = null;

  private static getGeminiClient(): GoogleGenAI | null {
    if (!this.geminiClient && process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.geminiClient;
  }

  /**
   * Parses a PDF file buffer using pdf-parse / pdfjs-dist.
   * If the PDF is scanned or has sparse text, automatically performs OCR
   * extraction using Gemini multimodal vision.
   */
  public static async parsePdfBuffer(
    buffer: Buffer,
    fileName: string,
    evidenceId: string,
    caseId: string,
    existingEntities: POLEEntity[] = [],
    forceOcr = false
  ): Promise<PdfParseDetails> {
    let rawText = '';
    let pageCount = 1;
    let metadata: Record<string, any> = {};
    let ocrApplied = false;

    // 1. Primary Text Extraction via pdf-parse (powered by pdfjs-dist)
    try {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo().catch(() => null);
      await parser.destroy().catch(() => {});

      if (textResult) {
        rawText = (textResult.text || '').trim();
        pageCount = textResult.total || 1;
      }

      if (infoResult) {
        metadata = {
          title: (infoResult as any).info?.Title || fileName,
          author: (infoResult as any).info?.Author || 'Unknown',
          producer: (infoResult as any).info?.Producer || '',
          creationDate: (infoResult as any).dates?.CreationDate || new Date().toISOString(),
        };
      }
    } catch (parseErr: any) {
      console.warn('pdf-parse direct stream extraction warning:', parseErr.message);
    }

    // 2. Optical Character Recognition (OCR) fallback/enhancement
    // If text is empty or sparse (< 60 chars) or forceOcr is enabled,
    // invoke Gemini 3.8 Flash for forensic document OCR.
    const isSparseOrScanned = rawText.replace(/\s+/g, '').length < 60;

    if ((isSparseOrScanned || forceOcr) && process.env.GEMINI_API_KEY) {
      const client = this.getGeminiClient();
      if (client) {
        try {
          const ocrPrompt = `You are a forensic law enforcement document analyst.
Perform high-fidelity Optical Character Recognition (OCR) and text transcription on this PDF evidence document.
Extract all readable text, suspect statements, accused names, phone numbers (+91 / standard MSISDNs), bank account numbers, IFSC codes, vehicle registration plates, IP addresses, dates, timestamps, monetary amounts, and physical incident locations.
Preserve exact names, identifiers, and statement structure accurately. Output the complete extracted narrative.`;

          const response = await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: buffer.toString('base64'),
                    },
                  },
                  { text: ocrPrompt },
                ],
              },
            ],
          });

          if (response.text && response.text.trim().length > 0) {
            rawText = response.text.trim();
            ocrApplied = true;
          }
        } catch (ocrErr: any) {
          console.warn('Gemini PDF OCR fallback error:', ocrErr.message);
        }
      }
    }

    // 3. Fallback text if both failed or empty
    if (!rawText || rawText.trim().length === 0) {
      rawText = `FORENSIC PDF EVIDENCE: ${fileName}
Evidence ID: ${evidenceId}
Case Reference: ${caseId}
Status: Ingested binary PDF. No optical or stream text detected in initial scan.`;
    }

    // 4. Parse Extracted Narrative into POLE graph nodes, relationships, and events
    const poleResult = PoleParser.parsePdfNarrative(
      rawText,
      evidenceId,
      caseId,
      existingEntities,
      fileName
    );

    const textSnippet = rawText.slice(0, 350).replace(/\r?\n/g, ' ') + (rawText.length > 350 ? '...' : '');

    return {
      ...poleResult,
      pageCount,
      ocrApplied,
      rawText,
      textSnippet,
      metadata,
    };
  }
}

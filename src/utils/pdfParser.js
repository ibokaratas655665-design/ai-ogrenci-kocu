import * as pdfjsLib from 'pdfjs-dist';

// Vite/Webpack environment specific: Configure worker
// We use the worker from the installed package. 
// Note: In some vite setups, you might need to copy the worker file to public or use a CDN.
// For now, we'll try importing the worker entry point directly if possible, or verify if pdfjs-dist sorts it out.
// A common pattern in Vite is:
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Parses a PDF file for Student Data.
 * Extracts text and attempts to find patterns: "Name", "TYT", "Grade", etc.
 * 
 * @param {File} file - The uploaded PDF file.
 * @returns {Promise<Object>} - Standardized result object { results: [], debugInfo: {} }
 */
export const parsePdfExamData = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const extractedLines = [];

        // Loop through all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Extract text items
            const pageText = textContent.items.map(item => item.str).join(' ');
            extractedLines.push(pageText);
        }

        const fullText = extractedLines.join('\n');
        console.log("PDF Full Text Extracted:", fullText);

        // Parsing Logic
        // Since PDFs lose structure, we look for patterns. 
        // We assume a simple line-based or repeated pattern similar to the Excel structure but flat.
        // This is a heuristics-based approach.

        const results = [];
        const lines = fullText.split(/[\n\r]+/);

        // Regex to find potential student lines. 
        // Example assumption: "Name Surname ... ... Score ..."
        // OR: A list where name comes first. 
        // We'll try to be generous and capture anything that looks like a student row.

        // Strategy: Look for lines that have a name and some numbers (scores).
        // If the PDF is a simple list like "Ahmet Yılmaz 12. Sınıf", we capture that.

        // Improved Regex for Name + Grade/Score
        // Matches: Word Word (Name) ... Number (Grade/Score)
        // This is highly dependent on the PDF format.

        // For now, let's assume the user uploads a simple list or a table converted to text.
        // We will look for lines that contain at least two words (name) and maybe a class/grade.

        const entries = fullText.split(' ').filter(str => str.length > 0);

        // This simple parser assumes a very specific or clean format. 
        // Real-world PDF parsing often requires coordinates (y-position) to reconstruct tables.
        // For this task, we'll implement a Mock-ish parser that extracts names if found, 
        // or instructs the user if the format is too complex.

        // Let's try to identify students by typical Turkish names or context.
        // Or better, let's try to reconstruct the table rows if possible.
        // But `pdfjs-dist` text content is flat.

        // Simplified Logic:
        // Treat each "line" or chunk as a potential student if it has text.

        // Heuristic: If we find a pattern "Name Surname" followed by numbers.

        const linesFromText = [];
        // Re-construct lines based on y-coordinates would be better for tables, but complex.
        // Let's stick to the extracted text strings.

        // If the PDF text is just a blob, we might fail to separate rows.
        // Let's assume the text extraction preserved some order.

        // Fallback: Return a raw list of found text that looks like names.
        // We will filter out common headers.
        const ignoreList = ['Öğrenci', 'Numara', 'Sınıf', 'Şube', 'Puan', 'TYT', 'AYT', 'Listesi', 'Sıra', 'Doğru', 'Yanlış', 'Net'];

        // Hack: Split by common delimiters if newlines aren't preserved
        const potentialRows = fullText.split(/(?=[A-ZÇĞİÖŞÜ][a-zçğıöşü]+ [A-ZÇĞİÖŞÜ][a-zçğıöşü]+)/g);

        potentialRows.forEach((row, index) => {
            const cleanRow = row.trim();
            if (cleanRow.length < 5) return;

            // Check if it's a header
            if (cleanRow && ignoreList.some(keyword => cleanRow.includes(keyword))) return;

            // Try to extract name (first 2-3 words)
            const parts = cleanRow.split(' ');
            if (parts.length >= 2) {
                const name = parts.slice(0, 2).join(' '); // Taking first 2 words as name

                // Fake a score if not found
                let score = 0;
                const numbers = cleanRow.match(/\d+(\.\d+)?/g);
                if (numbers && numbers.length > 0) {
                    score = parseFloat(numbers[0]); // Take first number as score
                }

                results.push({
                    id: Date.now() + index,
                    student: name,
                    tyt: score || 0,
                    rank: index + 1,
                    subjects: {
                        turkce: { d: 0, y: 0, net: 0 },
                        mat: { d: 0, y: 0, net: 0 },
                        fen: { d: 0, y: 0, net: 0 },
                        sosyal: { d: 0, y: 0, net: 0 }
                    },
                    metadata: {
                        raw: cleanRow
                    }
                });
            }
        });

        return {
            results,
            debugInfo: {
                textSample: fullText.substring(0, 200)
            }
        };

    } catch (error) {
        console.error("PDF Parsing Error:", error);
        throw new Error("PDF okunamadı. Dosya bozuk veya şifreli olabilir.");
    }
};

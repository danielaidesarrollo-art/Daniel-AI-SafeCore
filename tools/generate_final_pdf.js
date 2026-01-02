const { mdToPdf } = require('md-to-pdf');
const path = require('path');

async function generatePdf() {
    console.log("📄 Generating Audit Report PDF...");
    try {
        const pdf = await mdToPdf({ path: 'docs/Audit_Report.md' }).catch(console.error);
        if (pdf) {
            require('fs').writeFileSync('docs/SafeCore_Final_Report_v2.pdf', pdf.content);
            console.log("✅ PDF Generated: docs/SafeCore_Final_Report_v2.pdf");
        }
    } catch (error) {
        console.error("❌ PDF Generation Failed:", error);
        process.exit(1);
    }
}

generatePdf();

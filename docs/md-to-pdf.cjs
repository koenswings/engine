#!/usr/bin/env node
// Converts a markdown file to PDF using the VS Code markdown-pdf extension's
// own markdown-it parser and CSS, then renders via wkhtmltopdf.
// Usage: node docs/md-to-pdf.js <input.md> [output.pdf]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXT = '/home/pi/.vscode-server/extensions/yzane.markdown-pdf-1.5.0';
const md = require(`${EXT}/node_modules/markdown-it`)({ html: true, linkify: true, typographer: true });

const inputFile = process.argv[2];
if (!inputFile) { console.error('Usage: node md-to-pdf.js <input.md> [output.pdf]'); process.exit(1); }

const inputPath = path.resolve(inputFile);
const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : inputPath.replace(/\.md$/, '.pdf');
const tmpHtml = inputPath.replace(/\.md$/, '_tmp.html');

const markdownCss   = fs.readFileSync(`${EXT}/styles/markdown.css`, 'utf8');
const pdfCss        = fs.readFileSync(`${EXT}/styles/markdown-pdf.css`, 'utf8');
const highlightCss  = fs.readFileSync(`${EXT}/styles/tomorrow.css`, 'utf8');

const body = md.render(fs.readFileSync(inputPath, 'utf8'));

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${path.basename(inputFile)}</title>
<style>${markdownCss}</style>
<style>${highlightCss}</style>
<style>${pdfCss}</style>
</head>
<body class="vscode-body">
${body}
</body>
</html>`;

fs.writeFileSync(tmpHtml, html);

execSync(
  `wkhtmltopdf --enable-local-file-access --page-size A4 ` +
  `--margin-top 15mm --margin-bottom 15mm --margin-left 15mm --margin-right 15mm ` +
  `"${tmpHtml}" "${outputPath}"`,
  { stdio: 'inherit' }
);

console.log(`PDF written to ${outputPath}`);

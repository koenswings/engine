import { $, argv, chalk, fs, path } from 'zx'
import MarkdownIt from 'markdown-it'

if (argv.h || argv.help) {
  console.log(`
  Usage: ./md-to-pdf <input.md> [output.pdf]

  Converts a Markdown file to PDF using VS Code preview styles.

  Arguments:
    input.md      Path to the source Markdown file
    output.pdf    Path for the generated PDF (defaults to same location as input)

  Options:
    -h, --help    Print this help
  `)
  process.exit(0)
}

const inputArg = argv._[0]
if (!inputArg) {
  console.error(chalk.red('Error: No input file specified.'))
  console.log('Usage: ./md-to-pdf <input.md> [output.pdf]')
  process.exit(1)
}

const inputPath  = path.resolve(inputArg)
const outputPath = argv._[1]
  ? path.resolve(argv._[1])
  : inputPath.replace(/\.md$/, '.pdf')
const tmpHtml    = path.resolve('tmp', path.basename(inputPath).replace(/\.md$/, '_tmp.html'))

const stylesDir  = path.resolve('docs/styles')
const markdownCss  = await fs.readFile(`${stylesDir}/markdown.css`, 'utf8')
const highlightCss = await fs.readFile(`${stylesDir}/tomorrow.css`, 'utf8')
const pdfCss       = await fs.readFile(`${stylesDir}/markdown-pdf.css`, 'utf8')

const md   = new MarkdownIt({ html: true, linkify: true, typographer: true })
const body = md.render(await fs.readFile(inputPath, 'utf8'))

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${path.basename(inputPath)}</title>
<style>${markdownCss}</style>
<style>${highlightCss}</style>
<style>${pdfCss}</style>
</head>
<body class="vscode-body">
${body}
</body>
</html>`

await fs.writeFile(tmpHtml, html)

console.log(chalk.blue(`Generating PDF: ${outputPath}`))
await $`wkhtmltopdf --enable-local-file-access --page-size A4 --margin-top 15mm --margin-bottom 15mm --margin-left 15mm --margin-right 15mm ${tmpHtml} ${outputPath}`
console.log(chalk.green(`PDF written to ${outputPath}`))

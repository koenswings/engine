import { $, argv, chalk, fs, glob, path } from 'zx'
import MarkdownIt from 'markdown-it'

// Files excluded from --all batch processing
const EXCLUDE = [
  'docs/source-bundle.md',  // generated source dump, not a readable document
]

if (argv.h || argv.help) {
  console.log(`
  Usage: ./md-to-pdf <input.md> [output.pdf]
         ./md-to-pdf --all

  Converts Markdown files to PDF using VS Code preview styles.
  PDFs are written alongside their source .md files.

  Arguments:
    input.md      Path to the source Markdown file
    output.pdf    Path for the generated PDF (defaults to same location as input)

  Options:
    --all         Convert every .md file in the project (excludes generated files)
    -h, --help    Print this help
  `)
  process.exit(0)
}

const stylesDir    = path.resolve('docs/styles')
const markdownCss  = await fs.readFile(`${stylesDir}/markdown.css`, 'utf8')
const highlightCss = await fs.readFile(`${stylesDir}/tomorrow.css`, 'utf8')
const pdfCss       = await fs.readFile(`${stylesDir}/markdown-pdf.css`, 'utf8')
const md           = new MarkdownIt({ html: true, linkify: true, typographer: true })

// Generate a GitHub-compatible anchor id from a heading's text content
function toAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')  // decode entities
    .replace(/[^\w\s-]/g, '')  // remove chars that aren't word chars, spaces, or hyphens
    .replace(/ /g, '-')        // each space → hyphen (preserves doubles from "—" removal)
    .replace(/^-+|-+$/g, '')   // trim leading/trailing hyphens
}

// Add id attributes to heading elements so internal PDF links work
function addHeadingIds(html: string): string {
  return html.replace(/<(h[1-6])>(.*?)<\/\1>/gi, (_match, tag, inner) => {
    const text = inner.replace(/<[^>]+>/g, '')  // strip inline HTML tags
    return `<${tag} id="${toAnchor(text)}">${inner}</${tag}>`
  })
}

async function convert(inputPath: string, outputPath: string) {
  const tmpHtml = path.resolve('tmp', path.basename(inputPath).replace(/\.md$/, '_tmp.html'))
  const body    = addHeadingIds(md.render(await fs.readFile(inputPath, 'utf8')))

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
  console.log(chalk.blue(`Generating: ${path.relative(process.cwd(), outputPath)}`))
  // Feed HTML via stdin so wkhtmltopdf has no file:// base URL — fragment links
  // then become true internal PDF navigation rather than absolute file:// links.
  const proc = $`wkhtmltopdf --enable-local-file-access --page-size A4 --margin-top 15mm --margin-bottom 15mm --margin-left 15mm --margin-right 15mm - ${outputPath}`
  proc.stdin.end(html)
  console.log(chalk.green(`  ✓ ${path.relative(process.cwd(), outputPath)}`))
}

if (argv.all) {
  const files = await glob('**/*.md', {
    ignore: ['node_modules/**', 'dist/**', 'tmp/**', ...EXCLUDE],
  })
  console.log(chalk.blue(`Converting ${files.length} Markdown files...`))
  for (const file of files.sort()) {
    const inputPath  = path.resolve(file)
    const outputPath = inputPath.replace(/\.md$/, '.pdf')
    await convert(inputPath, outputPath)
  }
  console.log(chalk.green(`\nDone. ${files.length} PDFs generated.`))
} else {
  const inputArg = argv._[0]
  if (!inputArg) {
    console.error(chalk.red('Error: No input file specified.'))
    console.log('Usage: ./md-to-pdf <input.md> [output.pdf]  |  ./md-to-pdf --all')
    process.exit(1)
  }
  const inputPath  = path.resolve(inputArg)
  const outputPath = argv._[1] ? path.resolve(argv._[1]) : inputPath.replace(/\.md$/, '.pdf')
  await convert(inputPath, outputPath)
}

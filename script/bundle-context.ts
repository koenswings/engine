import { glob, fs, chalk } from 'zx'

const outputFile = 'docs/source-bundle.md'

console.log(chalk.blue(`Bundling source code into ${outputFile}...`))

const patterns = [
    'src/**/*.ts',
    'package.json',
    'tsconfig.json'
]

const files = await glob(patterns, { ignore: ['node_modules/**', 'dist/**'] })

let content = `# Project Source Code Context\nGenerated on ${new Date().toISOString()}\n\n`

for (const file of files) {
    console.log(chalk.grey(`Adding ${file}`))
    content += `## File: ${file}\n\`\`\`typescript\n`
    content += await fs.readFile(file, 'utf-8')
    content += `\n\`\`\`\n\n`
}

await fs.writeFile(outputFile, content)

console.log(chalk.green(`\nSuccess! Source code bundled into '${outputFile}'.`))
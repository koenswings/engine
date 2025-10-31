import WebSocket from 'ws';
import { chalk } from 'zx';

const url = process.argv[2];

if (!url) {
    console.error(chalk.red('Error: Please provide a WebSocket URL as an argument.'));
    process.exit(1);
}

console.log(chalk.blue(`Attempting to connect to ${url}...`));

const ws = new WebSocket(url, { timeout: 5000 });

ws.on('open', () => {
    console.log(chalk.green('Success! WebSocket connection established.'));
    ws.close();
    process.exit(0);
});

ws.on('error', (err) => {
    console.error(chalk.red(`Failed to connect: ${err.message}`));
    process.exit(1);
});

ws.on('close', () => {
    console.log(chalk.yellow('Connection closed.'));
});

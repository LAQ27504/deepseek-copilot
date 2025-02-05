import * as child_process from 'child_process';

import * as readline from 'readline';

// Create an interface to read from stdin (standard input) and write to stdout (standard output)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for input

let buffer = '';
// Start the model process
let model = child_process.exec('ollama run deepseek-coder-v2')


model.stdin?.write("hi\0")
process.stdin.resume()

model.stdout?.on('data', (data)=> {
    let chunk = data.toString();
        // Process output
        let words;

        buffer += chunk;
        words = buffer.split(" ");
        buffer = words.pop() || ''; // Keep last incomplete word
        console.log(words)
        if (words.length > 0) {
            console.log(words.join(' '))
        }
})

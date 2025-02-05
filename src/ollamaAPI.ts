import express, {Request, Response} from 'express';
import * as utils from './utils'
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from 'child_process';

const app = express();
const PORT = 8000;

interface IPrompt {
    text:string;
}

let model : ChildProcessWithoutNullStreams | null = null;

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatSession {
    id: string;
    history: ChatMessage[];
    model: string;
    process?: ChildProcess; // Keep process alive for streaming
}

// In-memory store (use Redis for production)
const sessions = new Map<string, ChatSession>();

app.use(express.json())

app.post('/deepseek', async (req: Request, res: Response) => {
    
    const {prompt, model_name} = req.body;
    console.log(req.body)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    let buffer = '';
    if (model === null){
        model = spawn('ollama', ['run', "deepseek-coder-v2"], {stdio: ['pipe', 'pipe', 'pipe']})   
    }

    model.on('error', (err) => {
        console.error('Model error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    });

    console.log('Model started:', model.pid);

    model.stdin.write(`${prompt}\n`);
    model.stdin.end()
    utils.addData({type: 'user', message: prompt})
    await model.stdout.on('data', (data) => {
        let chunk = data.toString();
        // Process output
        let words;

        buffer += chunk;
        words = buffer.split(" ");
        buffer = words.pop() || ''; // Keep last incomplete word
        console.log(words)
        if (words.length > 0) {
            res.write(JSON.stringify({ text: words.join(' ')}));
        }
    });
    res.end()
    model.on('close', () => {
        console.log('Model process closed');
        if (buffer.length > 0) {
            res.write(JSON.stringify({ text: buffer }));
        }
        res.end();
    });

    // 🔹 Handle model errors
    model.stderr.on('error', (err) => {
        console.error('Model stderr:', err.toString());
    });

    // 🔹 Kill process if client disconnects
    // req.on('close', () => {
    //     if (!model?.killed) {
    //         console.log('Client disconnected, killing model process...');
    //         model?.kill();
    //     }
    // });
});

app.listen(PORT, () => {
    
    console.log(`Server running on http://localhost:${PORT}`);
});
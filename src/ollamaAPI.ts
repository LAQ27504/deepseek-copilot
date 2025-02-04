import express, {Request, Response} from 'express';
import axios from 'axios';
import cors from "cors";
import {ChildProcessWithoutNullStreams, spawn} from 'child_process';

const app = express();
const PORT = 8000;

interface IPrompt {
    text:string;
}

let model : ChildProcessWithoutNullStreams | null = null;

app.use(express.json())

app.post('/deepseek', async (req: Request, res: Response) => {
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');


    model = spawn('ollama', ['run', 'deepseek-coder-v2'])   
    
    model.stdin.write("just generate only the code, no explaination of a Write a python script adding number for me \n");
    model.stdin.end()

    model.on('error', (err) => {
        res.json({error: err})
    })

    model.stdout.on('data', (data) => {
        const text = data.toString().trim()
        console.log(text === "")
        res.write(`data: ${JSON.stringify({ text : text + " "})}\n\n`);
    })

    model.on('close', ()=> {
        res.end()
    })


});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
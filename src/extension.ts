// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as utils from "./utils"
import path from 'path';
import express, {Request, Response} from 'express';
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from 'child_process';

const API_URL = 'http://localhost:8000/deepseek'
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "deepseek-copilot" is now active!');

    await api()
	
	vscode.window.showInformationMessage('Hello World from Deepseek Copilot!');
    utils.getExtensionPath(context)
	const disposable = vscode.commands.registerCommand('deepseek-copilot.openAIChat', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		ChatPanel.createOrShow(context.extensionUri)
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}



class ChatPanel {
    public static currentPanel: ChatPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri
    private _view?: vscode.WebviewView;
    
    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this.update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'chatPanel',
            'AI Chat',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
        panel.onDidDispose(() => (ChatPanel.currentPanel = undefined));
    }

    private update() {

        this._panel.webview.html = this.getHtml(this._panel.webview);
        this._panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'sendPrompt') {
                this.fetchAIResponse(message.text);
            }
        });
    }
    private async fetchAIResponse(prompt: string) {
        try {
            this._panel.webview.postMessage({ command: 'clearOutput' });
            const response = await fetch('http://localhost:8000/deepseek', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model_name: 'deepseek-coder-v2' }),
            });
    
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullres = ''
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    console.log(done)
                    if (done) break;
                    
                    const buffer = decoder.decode(value, {stream: true});
                    const data = JSON.parse(buffer); 
                    let smalltext = data.text; // 
                    fullres += smalltext + " "
                    this._panel.webview.postMessage({ command: 'streamOutput', text: fullres });
                }
            }
        } catch (error) {
            console.error('API Error:', error);
            return 'Error getting response from AI.';
        }
    }

    private getHtml(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

        const nonce = getNonce();

        return String.raw`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Deepseek Chat</title>
                <script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }

                    #chat-container {
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                        background-color: var(--vscode-sideBar-background);
                    }

                    .message {
                        max-width: 80%;
                        margin: 8px 0;
                        padding: 12px 16px;
                        border-radius: 18px;
                        line-height: 1.5;
                        word-break: break-word;
                        animation: fadeIn 0.3s ease-in;
                    }

                    .user {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        margin-left: auto;
                        border-bottom-right-radius: 4px;
                    }

                    .bot {
                        background-color: var(--vscode-input-background);
                        margin-right: auto;
                        border-bottom-left-radius: 4px;
                    }

                    #input-container {
                        padding: 16px;
                        background-color: var(--vscode-editorWidget-background);
                        border-top: 1px solid var(--vscode-editorWidget-border);
                        display: flex;
                        gap: 8px;
                    }

                    #input {
                        flex: 1;
                        padding: 10px 16px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 24px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        outline: none;
                    }

                    #send {
                        padding: 10px 20px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 24px;
                        cursor: pointer;
                    }

                    .code-container {
                        position: relative;
                        background-color: var(--vscode-textPreformat-background);
                        padding: 8px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }

                    .code-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 4px 8px;
                        background: var(--vscode-input-background);
                        border-top-left-radius: 4px;
                        border-top-right-radius: 4px;
                        font-size: 12px;
                        color: var(--vscode-editor-foreground);
                    }

                    .copy-button {
                        background: none;
                        border: none;
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div id="chat-container">
                    <div id="chat"></div>
                </div>
                <div id="input-container">
                    <input id="input" type="text" placeholder="Ask Deepseek Coder..." />
                    <button id="send">Send</button>
                </div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>

        `;
    }
}


async function api(){
    
    
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
    
    app.use(express.json())
    
    app.post('/deepseek', async (req: Request, res: Response) => {
        let historychat = utils.readAllData()
        const {prompt, model_name} = req.body;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        let buffer = '';
        model = spawn('ollama', ['run', "deepseek-coder-v2"], {stdio: ['pipe', 'pipe', 'pipe']})   
        
        model.on('error', (err) => {
            console.error('Model error:', err.message);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
        });
        let finalPrompt = ""
        console.log('Model started:', model.pid);
        console.log(historychat)
        if (historychat !== ''){
            finalPrompt = `You will act as the assistant, please do the ollowing prompt is "${prompt}". then you will follow the conversations and please do following lastest content and not mention the queried asked unless user asked. The queries asked is: ${historychat}`
        }
        else {
            finalPrompt = prompt
        }
        model.stdin.write(`${finalPrompt}\n`);
        model.stdin.end()
        utils.addData({type: 'I', message: prompt})
        await model.stdout.on('data', (data) => {
            let chunk = data.toString();
            // Process output
            let words;
    
            buffer += chunk;
            words = buffer.split(" ");
            buffer = words.pop() || ''; // Keep last incomplete word
            if (words.length > 0) {
                res.write(JSON.stringify({ text: words.join(' ')}));
            }
        });
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
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
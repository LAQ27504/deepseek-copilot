// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ollama from './ollamaAPI'
import axios from 'axios';

interface IPrompt {
    text:string;
}
interface StreamResponse {
    text: string;
    done: boolean;
}

const BASE_PROMPT =
  'You are a helpful code tutor. Your job is to teach the user with simple descriptions and sample code of the concept. Respond with a guided overview of the concept in a series of messages. Do not give the user the answer directly, but guide them to find the answer themselves. If the user asks a non-programming question, politely decline to respond.';

const API_URL = 'http://localhost:8000/deepseek'
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "deepseek-copilot" is now active!');
	let dataPost: IPrompt = {
		text:'Please make a python script for binary search recursion'
	};
	let dataRes = await axios.post(API_URL,dataPost, { responseType: "stream"})

	const stream = dataRes.data as unknown as NodeJS.ReadableStream;

	stream.on("data", (chunk: Buffer) => {
        const rawData = chunk.toString().trim();
        
        // Parse streamed JSON
        const parsedData: StreamResponse = JSON.parse(rawData.replace(/^data: /, ""));

        if (!parsedData.done) {
            console.log("Received:", parsedData.text);
        } else {
        }
            console.log("Stream finished.");
    });

    stream.on("end", () => {
        console.log("Stream ended.");
    });
						
	vscode.window.showInformationMessage('Hello World from Deepseek Copilot!');

	const disposable = vscode.commands.registerCommand('deepseek-copilot.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Deepseek Copilot!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

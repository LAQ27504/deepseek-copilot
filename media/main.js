
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
const md = markdownit(
    {
        highlight: function (str, lang) {
            const escapedStr = str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `<div class='code-container'>
                        <div class='code-header'>
                            <span>${lang || "plaintext"}</span>
                            <button class='copy-button' onclick='copyCode(this)'>Copy</button>
                        </div>
                        <pre><code>${escapedStr}</code></pre>
                    </div>`;
        }
    }
);
const chat = document.getElementById('chat');
const input = document.getElementById('input');
const send = document.getElementById('send');


const vscode = acquireVsCodeApi();

const state = vscode.getState() || { messages: [] };
state.messages.forEach(({ text, type }) => appendMessage(text, type, false));

send.addEventListener('click', sendMessage);

input.addEventListener('keydown', function(event) {
    if (event.key === "Enter") sendMessage();
});

function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    vscode.postMessage({ command: 'sendPrompt', text });
    input.value = '';
}

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command === 'streamOutput') {
        let lastMsg = document.querySelector('.bot:last-child');
        
        if (!lastMsg) {
            lastMsg = document.createElement('div');
            lastMsg.className = 'message bot';
            chat.appendChild(lastMsg);
        }
        
        lastMsg.innerHTML = md.render("Deepseek coder: " + message.text);
        chat.scrollTop = chat.scrollHeight;
        if (state.messages[state.messages.length - 1].type === 'bot'){
            state.messages[state.messages.length - 1].text = "Deepseek coder: " + message.text;
            state.messages[state.messages.length - 1].type = 'bot'
            vscode.setState(state);
        }
        else{
            state.messages.push({ text: "Deepseek coder: " + message.text, type: 'bot' });
            vscode.setState(state);
        }
    }
});

function appendMessage(text, type, save = true) {
    const msg = document.createElement('div');
    msg.className = 'message ' + type;
    msg.innerHTML = md.render(text);
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;

    if (save) {
        state.messages.push({ text, type });
        vscode.setState(state);
    }
}

function copyCode(button) {
    const code = button.parentElement.nextElementSibling.innerText;
    navigator.clipboard.writeText(code).then(() => {
        button.innerText = 'Copied!';
        setTimeout(() => button.innerText = 'Copy', 2000);
    });
}

async function streamGeneration(prompt: string, model = 'deepseek-coder-v2') {
  const response = await fetch('http://localhost:8000/deepseek', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model }),
  });

  if (!response.body) {
      console.error('No response body');
      return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  let buffer = '';

  async function readStream() {
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process event-stream messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete data in buffer

          for (const line of lines) {
              if (line.startsWith('data: ')) {
                  try {
                      const data = JSON.parse(line.slice(6)); // Remove "data: "
                      process.stdout.write(data.text + '\n'); // Add newline for readability
                      fullResponse += data.text;
                  } catch (error) {
                      console.error('Error parsing JSON:', error);
                  }
              }
          }
      }
  }

  await readStream();
  console.log('\nFinal response:\n', fullResponse);
}

streamGeneration("Create a python script for adding number for me")
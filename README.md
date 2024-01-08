# AI Scholar Agent with E2B

This answerQuestionWithGPT function accepts a text question as an argument, initializes the OpenAI API client, and then queries the Completions API with a prompt and the question argument. At the end, we simply return the trimmed response from GPT-3.5.

In this instance, our usage of AI is very simple. However, you could take this much further by giving the model access to tools like a code interpreter, API integrations, etc. This would allow for a wider variety of tasks to be handled by the agent.
### Core Function
The core function of this agent is we read the input file from the sandbox’s filesystem and format the contents into an array of trimmed questions. We answer each question with the answerQuestionWithGPT function above and save the response in the sandbox’s filesystem.

In the end, we view the output explanations folder to inspect the agent’s output. Then, we clear the input file to ensure that those questions aren’t answered again.
# Output
You can observe the agent’s activity through the console logs sprinkled all over the code and by checking the output in the explanations folder within the sandbox. 
### Running the AI agent
With the main logic and functions of the AI agent in place, we can run it and see it in action. Run the agent by executing 
```
node lib/index.js
```
in your terminal. This will kickstart the main function, setting up the sandbox environment and preparing the agent for processing questions. Once the agent is running, it will monitor the input/topics.txt file for changes. When new questions are added to this file, the agent will process them, generating answers using the GPT model.

*Note:* [E2B Sandboxes can run for only 24 hours at the moment](https://e2b.dev/docs/sandbox/overview). There are plans to make it indefinite, but for now, you can resume a sandbox anytime with its `id` with `await Sandbox.reconnect(sandbox.id)`.


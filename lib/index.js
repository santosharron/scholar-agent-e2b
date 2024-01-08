require("dotenv").config()
const { OpenAI } = require("openai")
const { Sandbox } = require("@e2b/sdk")

const INPUT_FOLDER = "input";
const INPUT_FILE = `${INPUT_FOLDER}/topics.txt`;
const OUTPUT_FOLDER = "explanations";

async function fileSystemSetup(sandbox) {
  const directories = [OUTPUT_FOLDER, INPUT_FOLDER];
  for (const dir of directories) {
    try {
      await sandbox.filesystem.makeDir(dir);
    } catch (error) {
      console.error(`Error setting up directory ${dir}:`, error.message);
    }
  }
}

async function saveToFile(name, data, sandbox) {
    data = data.trim();
  
    const formattedName = name.replace(/\s+/g, "-").toLowerCase();
    const timestamp = new Date().getTime();
    const fileName = `/${timestamp}-${formattedName}.md`;
    const filePath = `${OUTPUT_FOLDER}${fileName}`;
  
    try {
      await sandbox.filesystem.write(filePath, data);
      console.info(`Data saved to ${filePath} successfully.`);
      return { filePath, fileName };
    } catch (err) {
      console.error("Error saving data to file:", err);
    }
  }



  async function answerQuestionWithGPT(question) {
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  
    try {
      const gptResponse = await openaiClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `
              - You are the world's best tutor
              - You are the best at explaining complex concepts in simple terms
              - You will be asked questions about a wide range of topics
              - Your job is to answer the questions in a way that is easy to understand
              - Your answers should be informative, fun, and engaging
            `,
          },
          {
            role: "user",
            content: question,
          },
        ],
        model: "gpt-3.5-turbo",
      });
  
      return gptResponse?.choices[0]?.message.content?.trim();
    } catch (error) {
      console.error("Error summarizing text:", error.message);
      return "";
    }
  }

  async function viewFiles({ path, sandbox, download = true }) {
    try {
      const files = await sandbox.filesystem.list(path);
      const decodedFiles = [];
  
      if (download && files?.length) {
        for (const file of files) {
          const filePath = `${path}/${file.name}`;
          const fileData = await sandbox.filesystem.read(filePath);
  
          decodedFiles.push({ [filePath]: fileData });
        }
      }
  
      return {
        files,
        decodedFiles,
      };
    } catch (error) {
      console.error("Error viewing files:", error.message);
    }
  }

  async function agent(sandbox) {
    try {
      const inputFile = await sandbox.filesystem.read(INPUT_FILE);
      const questions = inputFile
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean);
  
      for (const question of questions) {
        const explanation = await answerQuestionWithGPT(question);
        if (explanation) {
          const { filePath } = await saveToFile(question, explanation, sandbox);
          console.info(`Saved explanation to ${filePath}`);
        }
      }
  
      if (questions.length) {
        const { files, decodedFiles } = (await viewFiles({ path: OUTPUT_FOLDER, sandbox })) ?? {};
        console.info(`Files in ${OUTPUT_FOLDER}:`, files);
        console.info(`Decoded files in ${OUTPUT_FOLDER}:`, decodedFiles);
  
        await sandbox.filesystem.write(INPUT_FILE, "");
      }
    } catch (err) {
      console.error("Error in agent function:", err);
    }
  }

  async function main() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set in environment variables");
      }
  
      if (!process.env.E2B_API_KEY) {
        throw new Error("E2B_API_KEY is not set in environment variables");
      }
  
      const sandbox = await Sandbox.create({ template: "base" });
      console.info(`Sandbox URL: https://${sandbox.getHostname()}`);
  
      await fileSystemSetup(sandbox);
      const inputFolderWatcher = sandbox.filesystem.watchDir(INPUT_FOLDER);
      inputFolderWatcher.addEventListener((event) => {
        if (event.path !== INPUT_FILE && event.operation !== "Write") {
          return;
        }
  
        agent(sandbox).catch((err) => {
          console.error("Error running agent:", err);
        });
      });
      await inputFolderWatcher.start();
  
      await sandbox.filesystem.write(
        INPUT_FILE,
        `
          What is an AI agent?
          How do butterflies get their colors?
          Why do we have leap years?
        `
      );
    } catch (error) {
      console.error("Error running bot:", error.message);
    }
  }
  
  main().catch((err) => {
    console.error("Unhandled error:", err);
  });
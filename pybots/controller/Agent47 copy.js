import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

const getMessage = async (req, res) => {
  const body = req.body;
  const model = new ChatGroq({
    apiKey: "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",
    model: "llama-3.1-70b-versatile",
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a telegram bot your job is to respond to the user about any movie they ask. Remember, answer questions about only movies. and respond with an object with the a field 'output'. If a qustion is not about movies just reply with. 'i only answer questions about movies' Also try to sound normal and not like a bot. ",
    ],
    ["human", "{body}"],
  ]);
  const messageOutput = z.object({
    output: z.string().describe("output of the ai model"),
  });
  const bot = prompt.pipe(model.withStructuredOutput(messageOutput));
  try {
    const result = await bot.invoke({ body: body.message.text });
    console.log("Result from bot.invoke:", result);
    if (result && typeof result === "object" && "output" in result) {
      return res.json(result);
    } else {
      console.error("Unexpected result structure:", result);
      return res.json({ output: "Sorry, I couldn't process your request." });
    }
  } catch (error) {
    console.error("Error in getMessage:", error);
    return res
      .status(400)
      .json({ output: "An error occurred while processing your request." });
  }
};

export { getMessage };

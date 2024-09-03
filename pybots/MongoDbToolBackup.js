import { Tool } from "langchain/tools";
import { MongoClient } from "mongodb";
import { ChatGroq } from "@langchain/groq";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

class MongoDBQueryTool extends Tool {
  constructor(connectionString, dbName, collectionName) {
    super();
    this.name = "MongoDB Query Tool";
    this.description =
      "Useful for querying MongoDB based on input parameters. Input should be a natural language query describing what to search for.";
    this.client = new MongoClient(connectionString);
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  async _call(query) {
    try {
      await this.client.connect();
      const db = this.client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      // Convert natural language query to MongoDB query
      const mongoQuery = this.naturalLanguageToMongoQuery(query);

      const result = await collection.findOne(mongoQuery);

      if (result) {
        // Convert ObjectId to string for JSON serialization
        result._id = result._id.toString();
        return JSON.stringify(result);
      } else {
        return JSON.stringify({ error: "No matching document found" });
      }
    } catch (error) {
      return JSON.stringify({ error: error.message });
    } finally {
      await this.client.close();
    }
  }

  naturalLanguageToMongoQuery(query) {
    // This is a simple implementation. You might want to use a more sophisticated NLP approach in a real-world scenario.
    const lowercaseQuery = query.toLowerCase();
    if (lowercaseQuery.includes("title")) {
      const titleMatch = query.match(/'([^']+)'/);
      if (titleMatch) {
        return { title: titleMatch[1] };
      }
    }
    // Add more conditions for other types of queries
    return {};
  }
}

// Set up the MongoDB tool
const connectionString =
  "mongodb+srv://calebadobah1234:bananaman1234@crackxx.fxot0.mongodb.net";
const dbName = "ai-blog";
const collectionName = "avamovies";
const mongoDbTool = new MongoDBQueryTool(
  connectionString,
  dbName,
  collectionName
);

// Set up LangChain agent
const model = new ChatGroq({
  apiKey: "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",
  model: "llama-3.1-70b-versatile",
});

const tools = [mongoDbTool];

async function createAgent() {
  return await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "zero-shot-react-description",
    verbose: true,
  });
}

// Function to run a query through the agent
async function runQuery(query) {
  try {
    const agent = await createAgent();
    const result = await agent.call({ input: query });
    console.log("Agent Output:", result.output);
    return result.output;
  } catch (error) {
    console.error("Error:", error);
    return "An error occurred while processing your request.";
  }
}

// Example usage
async function main() {
  const query = "Find a movie with the title 'Tuesday 2023'";
  const result = await runQuery(query);
  console.log("Final Result:", result);
}

main().catch(console.error);

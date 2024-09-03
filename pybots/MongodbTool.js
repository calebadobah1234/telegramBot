import { ChatGroq } from "@langchain/groq";
import { Tool } from "langchain/tools";
import { MongoClient } from "mongodb";
import { END, START, StateGraph } from "@langchain/langgraph";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

// MongoDB Query Tool
class MongoDBQueryTool extends Tool {
  constructor(connectionString, dbName, collectionName) {
    super();
    this.name = "MongoDB Query Tool";
    this.description =
      "Queries MongoDB based on input parameters. Returns raw JSON data.";
    this.client = new MongoClient(connectionString);
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  async _call(query) {
    try {
      await this.client.connect();
      const db = this.client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      const mongoQuery = this.naturalLanguageToMongoQuery(query);
      const result = await collection.findOne(mongoQuery);

      if (result) {
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
    const lowercaseQuery = query.toLowerCase();
    if (lowercaseQuery.includes("title")) {
      const titleMatch = query.match(/'([^']+)'/);
      if (titleMatch) {
        return { title: titleMatch[1] };
      }
    }
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

// Set up the LLM
const model = new ChatGroq({
  apiKey: "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",
  model: "llama-3.1-70b-versatile",
});

// Define the graph nodes
const parseQuery = RunnableSequence.from([
  (input) => input.query,
  async (query) => {
    const parseResult =
      await model.invoke(`Parse the following query and extract the key information:
Query: ${query}
Key information (in JSON format):`);
    console.log("Parsed Query:", parseResult);
    return { parsedQuery: parseResult.content }; // Extract content from AIMessage
  },
]);

const executeQuery = RunnableSequence.from([
  (input) => input.parsedQuery,
  async (parsedQuery) => {
    const queryResult = await mongoDbTool.call(parsedQuery);
    console.log("Query Result:", queryResult);
    return { queryResult };
  },
]);

const formatResponse = RunnableSequence.from([
  (input) => input.queryResult,
  async (queryResult) => {
    try {
      const jsonResult = JSON.parse(queryResult);
      return { finalResponse: JSON.stringify(jsonResult, null, 2) };
    } catch (error) {
      return { finalResponse: queryResult };
    }
  },
]);
// Create the graph
const workflow = new StateGraph({
  channels: ["query", "parsedQuery", "queryResult", "finalResponse"],
});

// Add nodes to the graph
workflow.addNode("ParseQuery", parseQuery);
workflow.addNode("ExecuteQuery", executeQuery);
workflow.addNode("FormatResponse", formatResponse);

// Define the edges
workflow.addEdge(START, "ParseQuery");
workflow.addEdge("ParseQuery", "ExecuteQuery");
workflow.addEdge("ExecuteQuery", "FormatResponse");
workflow.addEdge("FormatResponse", END);

// Compile the graph
const app = workflow.compile();

// Function to run a query through the graph
async function runQuery(query) {
  try {
    const result = await app.invoke({ query });
    return result.finalResponse;
  } catch (error) {
    console.error("Error:", error);
    return JSON.stringify({
      error: "An error occurred while processing your request.",
    });
  }
}

// Example usage
async function main() {
  const query = "Find a movie with the title 'Tuesday 2023'";
  const result = await runQuery(query);
  console.log("Final Result:", result);
}

main().catch(console.error);

import { MongoClient } from "mongodb";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { RetrievalQAChain } from "langchain/chains";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import dotenv from "dotenv";
dotenv.config();
const client = new MongoClient(process.env.MONGODB_URI);
const dbName = "movieDatabase";
const collectionName = "movies";

async function initializeRAGSystem() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Create embeddings using Sentence Transformers
    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "sentence-transformers/all-MiniLM-L6-v2",
    });

    // Create vector store
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection,
      indexName: "title", // Update this to your actual index name
      textKey: "description", // Assuming 'plot' is the field containing movie descriptions
      embeddingKey: "plot_embedding", // Field to store embeddings
    });

    // Create retriever
    const retriever = vectorStore.asRetriever();

    // Create language model using Hugging Face
    const model = new ChatGroq({
      apiKey: "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",
      model: "llama-3.1-70b-versatile",
    });

    // Create RetrievalQAChain
    const chain = RetrievalQAChain.fromLLM(model, retriever);

    return chain;
  } catch (error) {
    console.error("Error initializing RAG system:", error);
    throw error;
  }
}

async function queryRAGSystem(chain, query) {
  try {
    const response = await chain.call({
      query: query,
    });
    return response.text;
  } catch (error) {
    console.error("Error querying RAG system:", error);
    throw error;
  }
}

// Example usage
async function main() {
  const ragChain = await initializeRAGSystem();
  const query = "What movies are about time travel?";
  const answer = await queryRAGSystem(ragChain, query);
  console.log("Answer:", answer);
}

main()
  .catch(console.error)
  .finally(() => client.close());

export { initializeRAGSystem, queryRAGSystem };

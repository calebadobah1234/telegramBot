import { MongoClient } from "mongodb";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(
  "mongodb+srv://calebadobah1234:bananaman1234@crackxx.fxot0.mongodb.net"
);
const dbName = "ai-blog"; // Adjust if your database name is different
const collectionName = "avamovies"; // Adjust if your collection name is different

async function initializeRAGSystem() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "sentence-transformers/paraphrase-MiniLM-L6-v2",
    });

    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection,
      indexName: "default", // Update this to your actual index name
      textKey: "description", // Changed from 'plot' to 'description'
      embeddingKey: "description_embedding", // Changed from 'plot_embedding'
    });

    const retriever = vectorStore.asRetriever();

    return retriever;
  } catch (error) {
    console.error("Error initializing RAG system:", error);
    throw error;
  }
}

async function queryMovieDatabase(retriever, query) {
  try {
    const results = await retriever.getRelevantDocuments(query);
    if (results.length > 0) {
      const movie = results[0].metadata;
      return {
        title: movie.title,
        description: movie.description,
        categories: movie.categories,
        actors: movie.actors,
        yearOfPublication: movie.movieInfo.yearOfPublication,
        ageRange: movie.movieInfo.ageRange,
        language: movie.movieInfo.language,
        duration: movie.movieInfo.duration,
        director: movie.movieInfo.director,
        product: movie.movieInfo.product,
        originalDescription: movie.originalDescription,
      };
    }
    return null;
  } catch (error) {
    console.error("Error querying movie database:", error);
    throw error;
  }
}

export { initializeRAGSystem, queryMovieDatabase };

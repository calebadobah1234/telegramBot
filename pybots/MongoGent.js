import { ChatGroq } from "@langchain/groq";
import { Tool } from "langchain/tools";
import { MongoClient } from "mongodb";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

class MongoDBQueryTool extends Tool {
  constructor(connectionString, dbName, collectionName) {
    super();
    this.name = "MongoDB Query Tool";
    this.description =
      "Queries MongoDB based on input parameters. Returns filtered JSON data.";
    this.client = new MongoClient(connectionString);
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  async _call(queryString) {
    try {
      await this.client.connect();
      const db = this.client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      const query = JSON.parse(queryString);
      const result = await collection
        .find(query.filter)
        .project({
          title: 1,
          img: 1,
          "movieInfo.yearOfPublication": 1,
          imdb: 1,
          description: 1,
        })
        .toArray();

      if (result.length > 0) {
        return JSON.stringify(
          result.map((doc) => ({
            title: doc.title,
            imageLink: doc.img,
            releaseYear: doc.movieInfo?.yearOfPublication,
            imdb: doc.imdb,
            description: doc.description,
            _id: doc._id.toString(),
          }))
        );
      } else {
        return JSON.stringify({ error: "No matching documents found" });
      }
    } catch (error) {
      return JSON.stringify({ error: error.message });
    } finally {
      await this.client.close();
    }
  }
}

const connectionString =
  "mongodb+srv://calebadobah1234:bananaman1234@crackxx.fxot0.mongodb.net";
const dbName = "ai-blog";
const collectionName = "avamovies";
const mongoDbTool = new MongoDBQueryTool(
  connectionString,
  dbName,
  collectionName
);

const model = new ChatGroq({
  apiKey: "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",
  model: "llama-3.1-70b-versatile",
});

const queryGeneratorPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an AI model tasked with converting input messages into MongoDB queries. 
    Your responses should always support partial matches using regex and be case-insensitive. 
    Respond in JSON format with the following structure:
    {{
      "query": {{
        "filter": {{
          "title": {{
            "$regex": "searchTerm",
            "$options": "i"
          }}
        }}
      }}
    }}
    Ensure that the "searchTerm" is extracted from the input message and properly escaped for use in a regex pattern.,`,
  ],
  ["human", "{body}"],
]);

const queryGeneratorOutputSchema = z.object({
  query: z
    .object({
      filter: z
        .object({
          title: z
            .object({
              $regex: z
                .string()
                .describe("The regular expression pattern to match the title"),
              $options: z
                .string()
                .describe(
                  "Options for the regular expression (e.g., 'i' for case-insensitive)"
                ),
            })
            .describe("The title filter using regex for partial matching"),
        })
        .describe("The filter object containing query conditions"),
    })
    .describe("The MongoDB query object"),
});

const queryGenerator = await queryGeneratorPrompt.pipe(
  model.withStructuredOutput(queryGeneratorOutputSchema)
);

const telegramPostGeneratorPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an AI model tasked with converting movie search results into a structured Telegram post. 
    Create a post that includes the movie title, image, IMDb rating, release year, and a link to the website.
    The website link format is: http://filmvault.xyz/movies1/"movie title"
    Make the post engaging and informative. Use emoji where appropriate.
    Respond with a JSON object containing the following fields:
    - introText: A brief introduction to the search results
    - movies: An array of movie objects, each containing:
      - title: The movie title
      - imageLink: URL of the movie poster
      - releaseYear: Year the movie was released
      - imdbRating: The IMDb rating of the movie
      - websiteLink: Link to the movie on filmvault.xyz
      - description: A brief, engaging description of the movie (2-3 sentences)
    - outroText: A conclusion encouraging users to check out the movies`,
  ],
  ["human", "{searchResults}"],
]);

const telegramPostOutputSchema = z.object({
  introText: z.string().describe("Brief introduction to the search results"),
  movies: z
    .array(
      z.object({
        title: z.string().describe("Movie title"),
        imageLink: z.string().url().describe("URL of the movie poster"),
        releaseYear: z.string().describe("Year the movie was released"),
        imdbRating: z.number().describe("IMDb rating of the movie"),
        websiteLink: z
          .string()
          .url()
          .describe("Link to the movie on filmvault.xyz"),
        description: z
          .string()
          .describe("Brief, engaging description of the movie"),
      })
    )
    .describe("Array of movie objects"),
  outroText: z
    .string()
    .describe("Conclusion encouraging users to check out the movies"),
});

const telegramPostGenerator = telegramPostGeneratorPrompt.pipe(
  model.withStructuredOutput(telegramPostOutputSchema)
);

async function executeQueryAndGeneratePost(input) {
  // Generate the query
  const generatedQuery = await queryGenerator.invoke({
    body: input,
  });
  console.log("Generated Query:", JSON.stringify(generatedQuery));

  // Execute the query using the MongoDBQueryTool
  const queryResult = await mongoDbTool._call(
    JSON.stringify(generatedQuery.query)
  );
  console.log("Query Result:", queryResult);

  // Generate structured Telegram post
  const telegramPost = await telegramPostGenerator.invoke({
    searchResults: queryResult,
  });
  console.log(
    "Structured Telegram Post:",
    JSON.stringify(telegramPost, null, 2)
  );

  return telegramPost;
}

// Example usage
const result = await executeQueryAndGeneratePost(
  "find a movie with title 'mad max'"
);
console.log("Final Result:", JSON.stringify(result, null, 2));

import { getAxiosInstance } from "./axios.js";
import { returnTelegramPost } from "./MongoAgent.js";

const axiosInstance = getAxiosInstance();

const sendMessage = async (chatId, messageText) => {
  try {
    await axiosInstance.get("sendMessage", {
      chat_id: chatId,
      text: messageText,
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

const handleMessage = async (messageObj) => {
  const messageText = messageObj.text || "";
  const chatId = messageObj.chat.id;

  if (messageText.charAt(0) === "/") {
    const command = messageText.substr(1);
    switch (command) {
      case "start":
        return sendMessage(
          chatId,
          "Hi! I'm a movie bot. Ask me anything about movies!"
        );
      default:
        return sendMessage(
          chatId,
          "I don't understand that command. Just ask me about movies!"
        );
    }
  } else {
    try {
      const mockReq = {
        body: {
          message: {
            text: messageText,
          },
        },
      };

      const result = await returnTelegramPost(mockReq);
      console.log("Result from returnTelegramPost:", result);

      if (result && result.movies && result.movies.length > 0) {
        // Send intro message
        if (result.introText) {
          await sendMessage(chatId, result.introText);
        } else {
          await sendMessage(chatId, "Here are the movies I found:");
        }

        // Send a message for each movie
        for (const movie of result.movies) {
          let movieMessage = `<b>🎬 ${movie.title} (${movie.releaseYear})</b>\n`;
          movieMessage += `⭐ IMDb: ${movie.imdbRating}/10\n`;
          movieMessage += `🔗 <a href="${movie.websiteLink}">Watch here</a>\n`;
          movieMessage += `📝 ${movie.description}\n`;

          await sendMessage(chatId, movieMessage);

          // Optional: Add a delay between messages to avoid hitting rate limits
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Send outro message
        if (result.outroText) {
          await sendMessage(chatId, result.outroText);
        } else {
          await sendMessage(chatId, "Enjoy watching!");
        }
      } else {
        await sendMessage(
          chatId,
          "Sorry, I couldn't find any movies matching your query."
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      await sendMessage(
        chatId,
        "Sorry, I encountered an error while processing your request."
      );
    }
  }
};

export { handleMessage };

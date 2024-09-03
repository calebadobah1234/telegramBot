import { handleMessage } from "./bot.js";

const handler = async (req, method) => {
  const { body } = req;
  if (body) {
    const messageObj = body.message;
    await handleMessage(messageObj);
  }
  return;
};

export { handler };

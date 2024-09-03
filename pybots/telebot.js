import express from "express";
import { handler } from "./controller/index.js";
const PORT = process.env.PORT || 4040;
const app = express();
app.use(express.json());
import bodyParser from "body-parser";
app.use(bodyParser.json());
app.post("*", async (req, res) => {
  console.log(req.body.message.text);
  res.send(await handler(req));
});

app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Server connected on port ${PORT}`);
});

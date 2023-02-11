import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import express from "express";
import pkg from "body-parser";
const { json } = pkg;
const app = express();
import indexRouter from "./routes/index.mjs";

// use json parser
app.use(json());

// set route
app.use("/", indexRouter);

// start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

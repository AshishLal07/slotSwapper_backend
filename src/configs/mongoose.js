import mongoose from "mongoose";
import config from "./config.js";

mongoose.connect(config.database.url);

export const db = mongoose.connection;
db.once("open", () => {
  console.log("✅ connection established successfully");
});
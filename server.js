import "dotenv/config";
import express from "express";
const app = express();

import mongoose from "mongoose";
import databaseConnection from "./config/database.js";

import cors from "cors";
import corsOptions from "./config/corsOptions.js"
import cookieParser from "cookie-parser";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

import { logger } from "./middlewares/logEvents.js";
import errorHandler from "./middlewares/errorHandler.js";

const PORT = process.env.PORT || 8070;
const NODE_ENV = process.env.NODE_ENV;

// Connect to the database
databaseConnection();

// Middlewares Setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(cookieParser());

// custom middleware logger
if (NODE_ENV === "development") {
    app.use(logger);
}

app.use("/api/auth", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Handle all errors
if (NODE_ENV === "development") {
    app.use(errorHandler);
}

mongoose.connection.on("error", (error) => {
    console.error(`MongoDB Connection Error: ${error}`);
});

mongoose.connection.once("open", () => {
    console.log("MongoDB is connected")

    // Start the Server
    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`)
    })
})
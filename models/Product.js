import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        min: [0, "Price must be a non-negative value"],
    },
    category: {
        type: String,
        required: [true, "Product category is required"],
        enum: {
            values: ["Electronics", "Clothing", "Books", "Other"],
            message: "Invalid category"
        },
    },
    manufacturer: {
        type: String,
        trim: true,
    },
    image: {
        type: String
    },
    rating: [
        {
            type: Number,
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot be greater than 5"],
        }
    ],
});

const Product = mongoose.model("Product", productSchema);

export default Product;
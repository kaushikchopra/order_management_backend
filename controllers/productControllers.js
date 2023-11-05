import Product from "../models/Product.js";
import { nanoid } from "nanoid";
import { uploadFile, deleteFile } from "../config/s3.js";

// Create a new product
const createProduct = async (req, res) => {
    try {
        const file = req.file
        const imageName = `product-images/${nanoid(8)}_${file.originalname}`;
        const fileBuffer = file.buffer;

        await uploadFile(fileBuffer, imageName, file.mimetype)

        // Creating a new product in the database
        const { name, description, price, category, manufacturer } = req.body
        const imageUrl = "https://order-management-project.s3.ap-south-1.amazonaws.com/";

        const newProduct = await Product.create({
            name,
            description,
            price,
            category,
            manufacturer,
            image: imageUrl + imageName,
        });

        res.status(201).json(newProduct);
    } catch (err) {
        // console.error(err);
        res.status(400).json({ error: err.message });
    }
};

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a specific product data
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({ error: "Product not found" });
        } else {
            res.status(200).json(product);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a specific product
const updateProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        // console.error("product Id in server: ",productId)
        // Check if a new image is being uploaded
        if (req.file) {
            const file = req.file;
            const imageName = `product-images/${nanoid(8)}_${file.originalname}`;
            const fileBuffer = file.buffer;

            // Upload the new image to S3
            await uploadFile(fileBuffer, imageName, file.mimetype);

            // Update the imageUrl in the database
            req.body.image = "https://order-management-project.s3.ap-south-1.amazonaws.com/" + imageName;
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, req.body, { new: true });
        res.status(200).json(updatedProduct);
    } catch (err) {
        // console.error(err)
        res.status(500).json({ error: err.message });
    }
};

// Delete a specific product
const deleteProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        // Get the product to retrieve the associated image name
        const product = await Product.findById(productId);

        if (!product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        // Extract the image name from the product's image URL
        const imageUrl = product.image;
        const imageName = imageUrl.split("com/")[1];

        // Delete the image from S3
        await deleteFile(imageName);

        // Delete the product from the database
        const deleteProduct = await Product.findByIdAndRemove(productId);

        res.status(204).send(deleteProduct);
    } catch (err) {
        // console.error(err)
        res.status(500).json({ error: err.message });
    }
};


export { createProduct, getAllProducts, getProductById, updateProductById, deleteProductById }
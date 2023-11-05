import express from "express";
const router = express.Router();

import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProductById,
    deleteProductById,
} from "../controllers/productControllers.js";
import { isAuthenticated, authRole } from "../middlewares/authMiddlewares.js";
import multer from "multer";


const fileFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[0] === "image") {
        cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
};

// Create a Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter, limits: { fileSize: 3000000 } }); // Limit image size to 3 Mb

// Create a product
router.post("/", isAuthenticated, authRole("admin"), upload.single("image"), createProduct);

// Get all products
router.get("/", getAllProducts);

// Get a product by ID
router.get("/:id", isAuthenticated, authRole("admin"), getProductById);

// Update a product by ID
router.put("/:id", isAuthenticated, authRole("admin"), upload.single("image"), updateProductById);

// Delete a product by ID
router.delete("/:id", isAuthenticated, authRole("admin"), deleteProductById);

export default router;

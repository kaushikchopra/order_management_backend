import express from "express";
const router = express.Router();

import { createOrder, getAllOrders, getOrderById, getUserOrders, updateOrderStatus, deleteOrder } from "../controllers/orderControllers.js";
import { isAuthenticated, authRole } from "../middlewares/authMiddlewares.js";

// Create an order
router.post("/", createOrder);

// Get a list of all the orders
router.get("/", isAuthenticated, authRole("admin"), getAllOrders);

// Get a specific order by its Id
router.get("/:id", isAuthenticated, authRole("admin"), getOrderById);

// Get all orders of a specific user
router.get("/user/:id", isAuthenticated, authRole("admin"), getUserOrders);

// Update an order status
router.put("/", isAuthenticated, authRole("admin"), updateOrderStatus);

// Delete an order
router.delete("/:id", isAuthenticated, authRole("admin"), deleteOrder);

export default router;
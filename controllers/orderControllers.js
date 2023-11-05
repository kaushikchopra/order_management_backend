import mongoose from "mongoose";
import Order from "../models/Order.js"
import Product from "../models/Product.js";

// Function to get product name by productId
async function getProductNameById(productId) {
    try {
        const product = await Product.findById(productId).exec();
        return product ? product.name : "Unknown Product";
    } catch (error) {
        // console.error(`Error fetching product name: ${error.message}`);
        return "Unknown Product";
    }
}

// Create an order
const createOrder = async (req, res) => {
    try {
        const orderData = req.body;
        const order = await Order.create(orderData);

        res.status(201).json({ message: "Order has been placed." })
    } catch (err) {
        // console.error(`Error in creating an order: ${err.message}`)
        res.status(400).json({ error: "Failed to create the order" });
    }
}

// Get a list of all orders
const getAllOrders = async (req, res) => {
    try {
        // Fetch orders from the database and populate user and product details
        const populatedOrders = await Order.find({})
            .populate("user", "fullName") // Populate the "user" field and get user Id and fullName
            .exec();

        // Orders after User Data Populated
        const ordersWithPopulatedData = await Promise.all(
            populatedOrders.map(async (order) => {

                // Map products and quantities
                const populatedProducts = await Promise.all(
                    order.products.map(async (productId, index) => {
                        const productName = await getProductNameById(productId);
                        return {
                            id: productId,
                            name: productName,
                            quantity: order.quantities[index],
                        };
                    })
                );

                // Remove the 'quantities' property from the document
                const { quantities, ...orderData } = order._doc;

                return {
                    ...orderData,
                    products: populatedProducts, // Adding Products name along with its ID and Quantity
                };
            })
        );

        res.status(200).json(ordersWithPopulatedData);
    } catch (err) {
        // console.error(`Error in fetching all the orders data: ${err.message}`)
        res.status(500).json({ error: "Error in fetching all the orders data" });
    }
}

// Get a specific order by its Id
const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        // Check if the order exists
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.status(200).json(order);
    } catch (err) {
        // console.error(`Error in fetching the order by ID: ${err.message}`)
        res.status(500).json({ error: "Failed to fetch the order" });
    }
}

// Get all orders of a specific user
const getUserOrders = async (req, res) => {
    try {
        const userId = req.params.id

        // Check if the user Id is valid
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const orders = await Order.find({ user: userId });

        res.status(200).json(orders);
    } catch (err) {
        // console.error(`Error in fetching the orders of an user: ${err.message}`)
        res.status(500).json({ error: "Failed to fetch user orders" });
    }
}

// Update an order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        // Check if the order exists.
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.status = newStatus;
        await order.save();

        res.status(200).json({ message: "Status has been updated" });

    } catch (err) {
        // console.error(`Error in updating the order status: ${err.message}`)
        res.status(500).json({ error: "Failed to update the order status" });
    }
}

// Delete an order
const deleteOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        // Check if the order exists
        const order = await Order.findOneAndDelete({ _id: orderId });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.sendStatus(204); // Deleted Successfully and sending "No Content"

    } catch (err) {
        // console.error(`Error in deleting an order: ${err.message}`)
        res.status(500).json({ error: "Failed to delete the order " });
    }
}

export { createOrder, getAllOrders, getOrderById, getUserOrders, updateOrderStatus, deleteOrder };
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
    ],
    quantities: {
        type: [Number],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    billingInformation: {
        type: String,
        enum: ["Credit Card", "Debit Card", "Net Banking", "UPI", "Pay on Delivery"],
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected", "Packed", "Dispatched", "Delivered", "Returned"],
        default: "Pending"
    }
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
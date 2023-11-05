import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Please enter your name"],
        trim: true
    },
    username: {
        type: String,
        required: [true, "Please enter an email Id"],
        unique: true,
        trim: true,
        validate: {
            validator: (value) => {
                const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                return emailRegex.test(value);
            },
            message: "Please enter a valid email address"
        }
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
    },
    address: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    orders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order"
        }
    ],
    role: {
        type: String,
        enum: ["admin", "orderManagement", "delivery", "customer"],
        default: "customer"
    },
    isActivated: {
        type: Boolean,
        default: false
    },
    activateToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    resetToken: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
}

// Create a unique index on the 'username' field
userSchema.index({ username: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

export default User;
import express from "express";
import { activation, forgotPassword, handleLogout, handleRefreshToken, login, register, resendActivation, resetPassword } from "../controllers/userControllers.js";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Account Activation
router.patch("/activation/:token", activation);

// Re-send Activation
router.get("/resend-activation/:email", resendActivation);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password/:token", resetPassword)

// Refresh Token
router.get("/refresh", handleRefreshToken);

// Logout
router.post("/logout", handleLogout);

export default router;
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendActivationEmail, sendResetPasswordEmail } from "../utils/sendMail.js";

function isPasswordComplexEnough(password) {
    // At least 8 characters, containing at least one uppercase letter, one lowercase letter, one number, and one special character.
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Register
const register = async (req, res) => {
    try {
        const { fullName, username, password, address, phoneNumber } = req.body;

        if (!fullName || !username || !password) {
            return res.status(400).json({ error: "Please provide all required fields (fullName, username, password)" });
        }

        // Check password complexity
        if (!isPasswordComplexEnough(password)) {
            return res.status(400).json({ error: "Password must be at least 8 characters, containing at least one uppercase letter, one lowercase letter, one number, and one special character" });
        }

        // Check if the username (which contains the email) is already registered
        const existingUser = await User.findOne({ username }).exec();

        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const user = await User.create({
            fullName,
            username,
            password: hashedPassword,
            address,
            phoneNumber
        })

        // Generate an activation token
        const activationData = {
            userId: user._id
        }

        const expireInMinutes = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutes

        const activationToken = jwt.sign(activationData, process.env.JWT_SECRET, { expiresIn: expireInMinutes });

        // Save the activation token in DB
        user.activateToken = activationToken;
        await user.save();

        // Send the activation email
        const mailSentResponse = await sendActivationEmail(username, activationToken);

        if (mailSentResponse) {
            res.status(200).json({ message: `Please check your email ${username} to activate your account` })
        } else {
            res.status(500).json({ error: "Error sending account activation email" });
        };

    } catch (error) {
        // console.log(`Register: ${error}`)
        res.status(500).send("Internal Server Error")
    }
}

// Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Please provide both 'username' and 'password' fields" });
        }

        // Check if the user already exists
        const user = await User.findOne({ username }).exec();

        // User does not exists
        if (!user) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // Compare the password with hashed password
        const passwordCompare = await bcrypt.compare(password, user.password)

        if (passwordCompare) {
            // Check if the User account is activated
            if (!user.isActivated) {
                return res.status(400).json({ error: "Please activate your account before login" });
            }

            // Generate a login access token
            const expireInMinutes = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes

            const accessToken = jwt.sign(
                {
                    userId: user._id,
                    fullName: user.fullName,
                    role: user.role
                },
                process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: expireInMinutes
                }
            );

            const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });

            user.refreshToken = refreshToken;
            await user.save(); // Update the refresh token in the Database

            // Creates Secure Cookie with refresh token
            res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "None", maxAge: 24 * 60 * 60 * 1000 })

            // Send access token to user
            res.json({ message: "User logged in successfully!", role: user.role, userId: user._id, accessToken });
        } else {
            return res.status(400).json({ error: "Invalid credentials" }); // Password does not match
        }

    } catch (error) {
        // console.log(`Login: ${error}`)
        res.status(500).send("Internal Server Error");
    }
}

// Account Activation
const activation = async (req, res) => {
    try {
        const { token } = req.params;
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!decodedToken) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        const user = await User.findById(decodedToken.userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.isActivated) {
            return res.status(400).json({ message: "User is already activated" });
        }

        // Update the user's activation status and clear the activation token
        user.isActivated = true;
        user.activateToken = null;
        await user.save();

        res.json({ message: "Account activated successfully" });
    } catch (error) {
        // console.log(`Account Activation: ${error}`)
        res.status(500).send("Internal Server Error")
    }
}

// Resend Activation Link
const resendActivation = async (req, res) => {
    try {
        const { email } = req.params;

        // Find the user by email
        const user = await User.findOne({ username: email }).exec();

        if (!user) {
            return res.status(404).json({ error: "User not found. Please sign up." });
        }

        // Check if account has already been activated
        if (user.isActivated) {
            return res.status(200).json({ message: "Account is already activated." });
        }

        // Generate a new activation token
        const newActivationToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Update the user's activateToken
        user.activateToken = newActivationToken;
        await user.save();

        // Send a new activation email with the updated token.
        const mailSentResponse = await sendActivationEmail(email, newActivationToken);

        if (mailSentResponse) {
            return res.status(200).json({ message: `Please check your email ${email} to activate your account` })
        } else {
            return res.status(500).json({ error: "Error sending account activation email" });
        };

    } catch (error) {
        // console.log(`Account Activation: ${error}`)
        res.status(500).send("Internal Server Error")
    }
}

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body; // Get Email Id of the user

        if (!email) {
            return res.status(400).json({ error: "Please provide your email address" });
        }

        // Check if the user already exists
        const user = await User.findOne({ username: email }).exec();

        if (!user) {
            return res.status(404).json({ error: "Email ID does not exist" });
        }

        // Generate a password reset token with an expiration time
        const data = {
            userId: user._id,
        };
        const token = jwt.sign(
            data,
            process.env.JWT_SECRET,
            { expiresIn: Math.floor(Date.now() / 1000) + 30 * 60 } // Token expires in 30 minutes
        );

        user.resetToken = token; // Update the resetToken field
        await user.save();

        // Send reset password email
        const mailSentResponse = await sendResetPasswordEmail(email, token);

        if (mailSentResponse) {
            return res.status(200).json({
                message: "Password reset email sent"
            });
        } else {
            return res.status(400).json({
                error: "Error sending password reset email"
            });
        }
    } catch (error) {
        // console.log(`Forgot Password: ${error}`)
        res.status(500).send("Internal Server Error")
    }
}

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ error: "Please provide both 'newPassword' and 'confirmPassword' fields" });
        }

        // Check password complexity
        if (!isPasswordComplexEnough(newPassword)) {
            return res.status(400).json({ error: "Password must be at least 8 characters, containing at least one uppercase letter, one lowercase letter, one number, and one special character" });
        }

        // Find the password reset token
        const passwordResetToken = await User.findOne({ resetToken: token }).exec();

        if (!passwordResetToken) {
            return res.status(404).json({ error: "Invalid or expired Token" });
        }

        // Check if the token is valid
        const tokenData = jwt.verify(token, process.env.JWT_SECRET);

        if (!tokenData) {
            return res.status(401).json({ error: "Unauthorized: Invalid or expired Token" });
        }

        // Find the user associated with the token
        const user = await User.findById(tokenData.userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        //Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        //Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Delete the password reset token
        await User.findOneAndDelete({ resetToken: token });

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        // console.log(`Forgot Password: ${error}`)
        res.status(500).send("Internal Server Error")
    }
}

// Handle refresh token to fetch a new access token
const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;

    // Check if refresh token is present
    if (!cookies?.refreshToken) return res.sendStatus(401); // Unauthorized

    const refreshToken = cookies.refreshToken;

    // Check if the user based on the refresh token is available
    const user = await User.findOne({ refreshToken }).exec();

    if (!user) { return res.sendStatus(403); } // Forbidden

    // Evaluate the token and provide a new access token
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (error, decoded) => {
            if (error || user._id.toString() !== decoded.userId) {
                return res.sendStatus(403)
            }; // Forbidden

            const accessToken = jwt.sign(
                {
                    userId: decoded.userId,
                    fullName: user.fullName,
                    role: user.role
                },
                process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: Math.floor(Date.now() / 1000) + (15 * 60)
                } // Expires in 15 minutes
            );
            res.json({ userId: decoded.userId, accessToken });
        }
    )

}

// Handle Logout
const handleLogout = async (req, res) => {

    // Check if refresh token is available in the cookies
    const cookies = req.cookies;

    if (!cookies?.refreshToken) return res.sendStatus(204); // No Content
    const refreshToken = cookies.refreshToken;

    // Check if the refresh token is also in Database
    const user = await User.findOne({ refreshToken }).exec();
    if (!user) {
        res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "None" });
        return res.sendStatus(204);
    } // Clear the refresh token from cookies when the user is not found.

    // Delete refresh token in Database
    user.refreshToken = "";
    await user.save();

    // Delete refresh token from cookies;
    res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "None" });
    // if(res.clearCookie("refreshToken" , { httpOnly: true, secure: true, sameSite: "None" })) {
    //     console.log("cookie cleared");
    // }
    res.sendStatus(204);
}

export { register, login, activation, resendActivation, forgotPassword, resetPassword, handleRefreshToken, handleLogout }
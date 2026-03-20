const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

exports.authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized, token missing" });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: "Token expired. Please login again.",
                    expired: true,
                });
            }

            return res.status(401).json({ message: "Invalid token" });
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.isDeleted) {
            return res.status(401).json({ message: "Account deleted" });
        }

        if (!user.isActive) {
            return res.status(401).json({ message: "Account disabled" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

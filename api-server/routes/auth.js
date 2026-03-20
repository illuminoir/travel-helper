import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import pool from "../db.js";

const router = express.Router();

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Register
router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email format" });

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const [result] = await pool.query(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            [email, passwordHash]
        );
        const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, COOKIE_OPTIONS);
        res.status(201).json({ id: result.insertId, email });
    } catch (err) {
        console.error('Register error:', err);
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Email already in use" });
        }
        res.status(500).json({ error: "Database error" });
    }
});

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email format" });

    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = rows[0];
        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: "Invalid email or password" });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, COOKIE_OPTIONS);
        res.json({ id: user.id, email: user.email });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: "Database error" });
    }
});

// Logout
router.post("/logout", (req, res) => {
    res.clearCookie("token", COOKIE_OPTIONS);
    res.json({ success: true });
});

// Me
router.get("/me", async (req, res) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await pool.query("SELECT id, email FROM users WHERE id = ?", [payload.userId]);
        if (!rows[0]) return res.status(401).json({ error: "User not found" });
        res.json(rows[0]);
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email format" });

    try {
        const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        // Always return success to avoid email enumeration
        if (!rows[0]) return res.json({ success: true });

        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
            [token, expires, email]
        );

        // TODO change CLIENT_URL to the login page
        await transporter.sendMail({
            from: `"Travel Helper" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset your password',
            html: `
                <p>You requested a password reset for your Item Manager account.</p>
                <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                <p><a href="${process.env.CLIENT_URL}/reset-password?token=${token}">Reset Password</a></p>
                <p>If you didn't request this, you can safely ignore this email.</p>
            `,
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: "Database error" });
    }
});

// Reset password
router.post("/reset-password", async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and password required" });

    try {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
            [token]
        );
        const user = rows[0];
        if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

        const passwordHash = await bcrypt.hash(password, 12);
        await pool.query(
            "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
            [passwordHash, user.id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
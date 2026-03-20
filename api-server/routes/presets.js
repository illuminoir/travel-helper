import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [presets] = await pool.query(
            "SELECT * FROM presets WHERE user_id = ? ORDER BY created_at ASC",
            [req.userId]
        );
        res.json(presets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

router.put("/", async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Missing 'name'" });

    try {
        const [result] = await pool.query(
            "INSERT INTO presets (name, user_id) VALUES (?, ?)",
            [name, req.userId]
        );
        res.status(201).json({ id: result.insertId, name });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            res.status(409).json({ error: `Preset '${name}' already exists` });
        } else {
            res.status(500).json({ error: "Database error" });
        }
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "DELETE FROM presets WHERE id = ? AND user_id = ?",
            [id, req.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Preset '${id}' not found` });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
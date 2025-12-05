import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [tags] = await pool.query("SELECT * FROM tags");
        return res.json(tags);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Database error when getting all tags"});
    }
});

router.put("/", async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Missing or invalid 'name'" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO tags (name) VALUES (?)",
            [name]
        );

        res.status(201).json({ message: "Tag created", inserted: { name } });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            res.status(409).json({ error: `Tag with name '${name}' already exists` });
        } else {
            console.log(err);
            res.status(500).json({ error: "Database error" });
        }
    }
});

export default router;

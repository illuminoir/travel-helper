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

export default router;

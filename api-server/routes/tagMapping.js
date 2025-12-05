import express from "express";
import pool from "../db.js";

const router = express.Router();

router.put("/", async (req, res) => {
    const {itemId, tagId} = req.body;

    if (!itemId || !tagId) {
        return res.status(400).json({error: "Missing or invalid 'itemId' or 'tagId'"});
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO tag_mapping (itemId, tagId) VALUES (?, ?)",
            [itemId, tagId]
        );
        res.status(201).json({ message: `Mapping for itemId ${itemId} and tagId ${tagId} created'` });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            res.status(409).json({ error: `Mapping for itemId ${itemId} and tagId ${tagId} already exists` });
        } else {
            console.log(err);
            res.status(500).json({
                error: `Database error when inserting tag mapping for itemId ${itemId} and tagId ${tagId}`
            });
        }
    }
});

router.delete("/", async (req, res) => {
    try {
        const { itemId, tagId } = req.body;
        await pool.query("DELETE FROM tag_mapping WHERE itemId = ? AND tagId = ?", [itemId, tagId]);
        res.json({ success: true, message: "Item deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: `Database error when deleting tag mapping for itemId ${itemId} and tagId ${tagId}`
        });
    }
});

export default router;

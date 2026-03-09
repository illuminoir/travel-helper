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
            "INSERT INTO tag_mapping (item_id, tag_id) VALUES (?, ?)",
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
        await pool.query("DELETE FROM tag_mapping WHERE item_id = ? AND tag_id = ?", [itemId, tagId]);
        res.json({ success: true, message: "Mapping deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: `Database error when deleting tag mapping for itemId ${itemId} and tagId ${tagId}`
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM tag_mapping WHERE item_id = ?", [id]);
        res.json({ success: true, message: "Mappings for item deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: `Database error when deleting tag mapping for itemId ${itemId}`
        });
    }
});

//for debug purposes
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [mappings] = await pool.query("SELECT * FROM tag_mapping WHERE itemId = ?", [id]);
        return res.json(mappings);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Database error when getting all mappings for item"});
    }
});

export default router;

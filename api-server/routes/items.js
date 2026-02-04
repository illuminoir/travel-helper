import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [items] = await pool.query("SELECT * FROM travel_items");

        // Enrich each item with its tags
        const enrichedItems = await Promise.all(
            items.map(async (item) => {
                // Get tag IDs from tag_mapping
                const [tagLinks] = await pool.query(
                    "SELECT tagId FROM tag_mapping WHERE itemId = ?",
                    [item.id]
                );

                const tagIds = tagLinks.map(link => link.tagId);

                let tags = [];
                if (tagIds.length > 0) {
                    const [tagRows] = await pool.query(
                        `SELECT * FROM tags WHERE id IN (${tagIds.map(() => '?').join(',')})`,
                        tagIds
                    );
                    tags = tagRows.sort((a, b) => a.name.localeCompare(b.name));

                }

                return {
                    ...item,
                    tags,
                };
            })
        );

        res.json(enrichedItems);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


router.put("/", async (req, res) => {
    const { name, weight } = req.body;

    if (!name || typeof weight !== "number") {
        return res.status(400).json({ error: "Missing or invalid 'name' or 'weight'" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO travel_items (name, weight) VALUES (?, ?)",
            [name, weight]
        );

        res.status(201).json({ message: "Item inserted", inserted: { name, weight } });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            res.status(409).json({ error: `Item with name '${name}' already exists` });
        } else {
            console.log(err);
            res.status(500).json({ error: "Database error" });
        }
    }
});


router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM travel_items WHERE id = ?", [id]);
        res.json({ success: true, message: "Item deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
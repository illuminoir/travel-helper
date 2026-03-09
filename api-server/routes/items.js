import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { preset_id } = req.query;
    if (!preset_id) return res.status(400).json({ error: "Missing preset_id" });

    try {
        const [rows] = await pool.query(`
            SELECT 
                ti.*,
                t.id as tag_id,
                t.name as tag_name
            FROM travel_items ti
            LEFT JOIN tag_mapping tm ON ti.id = tm.item_id
            LEFT JOIN tags t ON tm.tag_id = t.id
            WHERE ti.preset_id = ?
            ORDER BY ti.name ASC
        `, [preset_id]);

        // Group tags onto each item
        const itemMap = new Map();
        for (const row of rows) {
            if (!itemMap.has(row.id)) {
                itemMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    weight: row.weight,
                    dropped: row.dropped,
                    quantity: row.quantity,
                    presetId: row.presetId,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    tags: [],
                });
            }
            if (row.tag_id) {
                itemMap.get(row.id).tags.push({ id: row.tag_id, name: row.tag_name });
            }
        }

        res.json([...itemMap.values()]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


router.put("/", async (req, res) => {
    const { name, weight, preset_id } = req.body;

    if (!name || typeof weight !== "number" || !preset_id) {
        return res.status(400).json({ error: "Missing or invalid 'name', 'weight', or 'preset_id'" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO travel_items (name, weight, preset_id) VALUES (?, ?, ?)",
            [name, weight, preset_id]
        );
        res.status(201).json({ message: "Item inserted", id: result.insertId, inserted: { name, weight, preset_id } });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            res.status(409).json({ error: `Item with name '${name}' already exists` });
        } else {
            res.status(500).json({ error: "Database error" });
        }
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { weight, dropped, quantity } = req.body;

    const fields = [];
    const values = [];

    if (typeof weight === "number")  { fields.push("weight = ?");   values.push(weight); }
    if (typeof dropped === "boolean"){ fields.push("dropped = ?");  values.push(dropped); }
    if (typeof quantity === "number"){ fields.push("quantity = ?"); values.push(quantity); }

    if (fields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(id);

    try {
        const [result] = await pool.query(
            `UPDATE travel_items SET ${fields.join(", ")} WHERE id = ?`,
            values
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Item with id '${id}' not found` });
        }
        res.status(200).json({ message: "Item updated", updated: { id, ...req.body } });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Database error" });
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
router.delete("/", async (req, res) => {
    try {
        await pool.query("DELETE FROM travel_items");
        res.json({ success: true, message: "Items deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
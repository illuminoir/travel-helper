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
            ORDER BY
                CASE WHEN ti.dropped = 0 THEN ti.name END ASC,
                CASE WHEN ti.dropped = 1 THEN ti.order_index END ASC
        `, [preset_id]);

        const itemMap = new Map();
        for (const row of rows) {
            if (!itemMap.has(row.id)) {
                itemMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    weight: row.weight,
                    dropped: row.dropped,
                    quantity: row.quantity,
                    order_index: row.order_index,
                    preset_id: row.preset_id,
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
    const { name, weight, preset_id, quantity, dropped, order_index } = req.body;

    if (!name || typeof weight !== "number" || !preset_id) {
        return res.status(400).json({ error: "Missing or invalid 'name', 'weight', or 'preset_id'" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO travel_items (name, weight, preset_id, quantity, dropped, order_index) VALUES (?, ?, ?, ?, ?, ?)",
            [name, weight, preset_id, quantity ?? 0, dropped ? 1 : 0, order_index ?? 0]
        );
        res.status(201).json({ message: "Item inserted", id: result.insertId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Database error" });
    }
});

router.put("/batch", async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing or invalid 'items'" });
    }

    try {
        const values = items.map(item => [
            item.name,
            item.weight,
            item.preset_id,
            item.quantity ?? 0,
            item.dropped ? 1 : 0,
            item.order_index ?? 0,
        ]);

        const [result] = await pool.query(
            "INSERT INTO travel_items (name, weight, preset_id, quantity, dropped, order_index) VALUES ?",
            [values]
        );

        const insertedIds = Array.from(
            { length: result.affectedRows },
            (_, i) => result.insertId + i
        );

        res.status(201).json({ insertedIds });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { weight, dropped, quantity, order_index } = req.body;

    const fields = [];
    const values = [];

    if (typeof weight === "number")  { fields.push("weight = ?");   values.push(weight); }
    if (typeof dropped === "boolean"){ fields.push("dropped = ?");  values.push(dropped); }
    if (typeof quantity === "number"){ fields.push("quantity = ?"); values.push(quantity); }
    if (typeof name === "string" && name.trim()) { fields.push("name = ?"); values.push(name.trim()); }
    if (typeof order_index === "number") { fields.push("order_index = ?"); values.push(order_index); }

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
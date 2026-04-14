import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { presetId } = req.query;
    if (!presetId) return res.status(400).json({ error: "Missing presetId" });

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
                CASE WHEN ti.bag_index IS NULL THEN ti.name END ASC,
                CASE WHEN ti.bag_index IS NOT NULL THEN ti.order_index END ASC
        `, [presetId]);

        const itemMap = new Map();
        for (const row of rows) {
            if (!itemMap.has(row.id)) {
                itemMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    weight: row.weight,
                    bagIndex: row.bag_index,
                    quantity: row.quantity,
                    orderIndex: row.order_index,
                    presetId: row.preset_id,
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
    const { name, weight, presetId, quantity, bagIndex, orderIndex } = req.body;

    if (!name || typeof weight !== "number" || !presetId) {
        return res.status(400).json({ error: "Missing or invalid 'name', 'weight', or 'presetId'" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO travel_items (name, weight, preset_id, quantity, bag_index, order_index) VALUES (?, ?, ?, ?, ?, ?)",
            [name, weight, presetId, quantity ?? 1, bagIndex ?? null, orderIndex ?? 0]
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
            item.presetId,
            item.quantity ?? 1,
            item.bagIndex ?? null,
            item.orderIndex ?? 0,
        ]);

        const [result] = await pool.query(
            "INSERT INTO travel_items (name, weight, preset_id, quantity, bag_index, order_index) VALUES ?",
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
    const { weight, bagIndex, quantity, orderIndex, name } = req.body;

    const fields = [];
    const values = [];

    if (typeof weight === "number") { fields.push("weight = ?"); values.push(weight); }
    if (typeof quantity === "number") { fields.push("quantity = ?"); values.push(quantity); }
    if (typeof name === "string" && name.trim()) { fields.push("name = ?"); values.push(name.trim()); }
    if (typeof orderIndex === "number") { fields.push("order_index = ?"); values.push(orderIndex); }
    // bagIndex can be null (moving back to available) or a number (moving to a bag)
    if ('bagIndex' in req.body) { fields.push("bag_index = ?"); values.push(bagIndex ?? null); }

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
    const { presetId } = req.query;
    try {
        if (presetId) {
            await pool.query("DELETE FROM travel_items WHERE preset_id = ?", [presetId]);
        } else {
            await pool.query("DELETE FROM travel_items");
        }
        res.json({ success: true, message: "Items deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
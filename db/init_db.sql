CREATE DATABASE IF NOT EXISTS `traveldb`;
USE traveldb;

CREATE TABLE IF NOT EXISTS presets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS travel_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    preset_id INT,
    name VARCHAR(255),
    weight DECIMAL(20, 3),
    dropped BOOLEAN DEFAULT FALSE,
    quantity INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tag_mapping (
    item_id INT,
    tag_id INT,
    PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY (item_id) REFERENCES travel_items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

INSERT INTO presets (name) VALUES ('Default');

INSERT INTO travel_items (name, weight, preset_id) VALUES ('Luggage', 2400, 1);
INSERT INTO travel_items (name, weight, preset_id) VALUES ('Coat', 1200, 1);
INSERT INTO travel_items (name, weight, preset_id) VALUES ('Toothbrush', 200, 1);

INSERT INTO tags (name) VALUES ('Clothing');
INSERT INTO tags (name) VALUES ('Travel Gear');
INSERT INTO tags (name) VALUES ('Hygiene');
INSERT INTO tags (name) VALUES ('Winter');
INSERT INTO tags (name) VALUES ('Black');
INSERT INTO tags (name) VALUES ('White');

INSERT INTO tag_mapping VALUES (1, 2);
INSERT INTO tag_mapping VALUES (2, 1);
INSERT INTO tag_mapping VALUES (3, 3);
INSERT INTO tag_mapping VALUES (2, 4);
INSERT INTO tag_mapping VALUES (1, 5);
INSERT INTO tag_mapping VALUES (3, 5);
INSERT INTO tag_mapping VALUES (2, 6);
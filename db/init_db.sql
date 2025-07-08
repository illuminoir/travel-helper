CREATE DATABASE IF NOT EXISTS `traveldb`;
USE traveldb;
CREATE TABLE IF NOT EXISTS travel_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- UNIQUE on name is paired with checks in the front-end to make sure names are unique --
    name VARCHAR(255) UNIQUE,
    weight INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS isTagged (
    itemId INT,
    tagId INT,
    PRIMARY KEY (itemId, tagId),
    FOREIGN KEY (itemId) REFERENCES travel_items(id) ON DELETE CASCADE,
    FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
);

INSERT INTO travel_items(name, weight) VALUES("Luggage", 2400);
INSERT INTO travel_items(name, weight) VALUES("Coat", 1200);
INSERT INTO travel_items(name, weight) VALUES("Toothbrush", 200);

INSERT INTO tags(name) VALUES("Clothing");
INSERT INTO tags(name) VALUES("Travel Gear");
INSERT INTO tags(name) VALUES("Hygiene");
INSERT INTO tags(name) VALUES("Winter");
INSERT INTO tags(name) VALUES("Black");
INSERT INTO tags(name) VALUES("White");

INSERT INTO isTagged VALUES(1, 2);
INSERT INTO isTagged VALUES(2, 1);
INSERT INTO isTagged VALUES(3, 3);
INSERT INTO isTagged VALUES(2, 4);
INSERT INTO isTagged VALUES(1, 5);
INSERT INTO isTagged VALUES(3, 5);
INSERT INTO isTagged VALUES(2, 6);
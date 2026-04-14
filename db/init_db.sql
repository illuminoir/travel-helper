CREATE DATABASE IF NOT EXISTS `traveldb`;
USE traveldb;

CREATE TABLE users (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       reset_token VARCHAR(255),
                       reset_token_expires DATETIME,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS presets (
                                       id INT AUTO_INCREMENT PRIMARY KEY,
                                       user_id INT NOT NULL,
                                       name VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS travel_items (
                                            id INT AUTO_INCREMENT PRIMARY KEY,
                                            preset_id INT,
                                            name VARCHAR(255),
    weight DECIMAL(20, 3) DEFAULT 0,
    quantity INT DEFAULT 1,
    bag_index INT DEFAULT NULL,
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS tags (
                                    id INT PRIMARY KEY AUTO_INCREMENT,
                                    user_id INT NOT NULL,
                                    name VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS tag_mapping (
                                           item_id INT,
                                           tag_id INT,
                                           PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY (item_id) REFERENCES travel_items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

-- Default user (password: "admin")
INSERT INTO users (email, password_hash) VALUES (
                                                    'admin@admin.com',
                                                    '$2b$12$97eXDDgNDkMnCXJpFaLEsujG/4e4ORDYJ0TzjIFGSwhHvgkVP1bZq'
                                                );

-- Default preset for the admin user
INSERT INTO presets (user_id, name) VALUES (1, 'Default');

-- Default items
INSERT INTO travel_items (name, weight, preset_id) VALUES ('Luggage', 2400, 1);
INSERT INTO travel_items (name, weight, preset_id) VALUES ('Coat', 1200, 1);
INSERT INTO travel_items (name, weight, preset_id) VALUES ('Toothbrush', 200, 1);

-- Default tags scoped to admin user
INSERT INTO tags (user_id, name) VALUES (1, 'Clothing');
INSERT INTO tags (user_id, name) VALUES (1, 'Travel Gear');
INSERT INTO tags (user_id, name) VALUES (1, 'Hygiene');
INSERT INTO tags (user_id, name) VALUES (1, 'Winter');
INSERT INTO tags (user_id, name) VALUES (1, 'Black');
INSERT INTO tags (user_id, name) VALUES (1, 'White');

INSERT INTO tag_mapping VALUES (1, 2);
INSERT INTO tag_mapping VALUES (2, 1);
INSERT INTO tag_mapping VALUES (3, 3);
INSERT INTO tag_mapping VALUES (2, 4);
INSERT INTO tag_mapping VALUES (1, 5);
INSERT INTO tag_mapping VALUES (3, 5);
INSERT INTO tag_mapping VALUES (2, 6);
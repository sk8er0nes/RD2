USE cico_tracker;

CREATE TABLE meals (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) ENGINE = INNODB;

INSERT INTO meals (id, name) VALUES
    (1, 'N/A'),
    (2, 'Breakfast'),
    (3, 'Lunch'),
    (4, 'Dinner'),
    (5, 'Snack');
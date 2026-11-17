USE cico_tracker;

ALTER TABLE food_entries
    ADD COLUMN meal_id INT UNSIGNED NULL DEFAULT NULL,
    ADD CONSTRAINT fk_food_entries_meals
        FOREIGN KEY (meal_id) REFERENCES meals(id)
        ON DELETE SET NULL;
USE cico_tracker;

-- Associate all existing entries with N/A.
UPDATE food_entries SET meal_id = 1;

-- Replace the nullable relationship with a compulsory one.
ALTER TABLE food_entries
    DROP FOREIGN KEY fk_food_entries_meals;

ALTER TABLE food_entries
    MODIFY COLUMN meal_id INT UNSIGNED NOT NULL DEFAULT 1;

ALTER TABLE food_entries
    ADD CONSTRAINT fk_food_entries_meals
        FOREIGN KEY (meal_id) REFERENCES meals(id)
        ON DELETE RESTRICT;
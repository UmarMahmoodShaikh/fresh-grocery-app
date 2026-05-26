class CreateBudgetProfilesAndCategoryBudgets < ActiveRecord::Migration[7.2]
  def change
    create_table :budget_profiles do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.decimal :total_budget, precision: 10, scale: 2, default: 0
      t.boolean :is_active, default: false, null: false

      t.timestamps
    end

    add_index :budget_profiles, [:user_id, :name], unique: true

    create_table :category_budgets do |t|
      t.references :budget_profile, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.decimal :amount, precision: 10, scale: 2, default: 0

      t.timestamps
    end

    add_index :category_budgets, [:budget_profile_id, :category_id], unique: true
  end
end

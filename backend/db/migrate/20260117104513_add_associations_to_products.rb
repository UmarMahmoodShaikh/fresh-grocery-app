class AddAssociationsToProducts < ActiveRecord::Migration[7.2]
  def change
    add_reference :products, :category, null: true, foreign_key: true
    add_reference :products, :brand, null: true, foreign_key: true
    remove_column :products, :category, :string
    remove_column :products, :brand, :string
  end
end

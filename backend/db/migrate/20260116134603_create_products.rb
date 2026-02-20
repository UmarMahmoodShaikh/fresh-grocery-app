class CreateProducts < ActiveRecord::Migration[7.2]
  def change
    create_table :products do |t|
      t.string :name
      t.decimal :price, precision: 10, scale: 2
      t.integer :stock
      t.text :description
      t.string :image_url
      t.string :category
      t.string :brand
      t.jsonb :nutrition
      t.string :barcode

      t.timestamps
    end
  end
end

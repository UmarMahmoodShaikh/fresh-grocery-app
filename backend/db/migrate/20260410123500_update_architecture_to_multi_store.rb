class UpdateArchitectureToMultiStore < ActiveRecord::Migration[7.2]
  def change
    # 1. New Tables
    create_table :stores do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :logo_url
      t.string :banner_url
      t.boolean :active, default: true
      t.timestamps
    end
    add_index :stores, :slug, unique: true

    create_table :store_products do |t|
      t.references :store, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.decimal :price, precision: 10, scale: 2
      t.decimal :discount_price, precision: 10, scale: 2
      t.integer :stock, default: 0
      t.timestamps
    end
    add_index :store_products, [:store_id, :product_id], unique: true

    create_table :store_categories do |t|
      t.references :store, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.timestamps
    end
    add_index :store_categories, [:store_id, :category_id], unique: true

    create_table :carts do |t|
      t.references :user, null: false, foreign_key: true
      t.references :store, null: false, foreign_key: true
      t.timestamps
    end

    create_table :cart_items do |t|
      t.references :cart, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity, default: 1
      t.timestamps
    end

    create_table :promotions do |t|
      t.references :store, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.datetime :starts_at
      t.datetime :ends_at
      t.timestamps
    end

    create_table :banners do |t|
      t.references :store, null: false, foreign_key: true
      t.string :image_url
      t.string :link_url
      t.timestamps
    end

    # 2. Schema Updates
    add_reference :categories, :parent, foreign_key: { to_table: :categories }
    add_reference :orders, :store, foreign_key: true
    add_column :order_items, :promotion_price, :decimal, precision: 10, scale: 2
  end
end

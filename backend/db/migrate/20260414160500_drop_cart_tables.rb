class DropCartTables < ActiveRecord::Migration[7.2]
  def change
    drop_table :cart_items if table_exists?(:cart_items)
    drop_table :carts if table_exists?(:carts)
  end
end

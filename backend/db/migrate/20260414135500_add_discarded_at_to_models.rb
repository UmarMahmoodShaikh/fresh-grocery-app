class AddDiscardedAtToModels < ActiveRecord::Migration[7.2]
  def change
    add_column :products, :discarded_at, :datetime
    add_index :products, :discarded_at
    
    add_column :stores, :discarded_at, :datetime
    add_index :stores, :discarded_at

    add_column :categories, :discarded_at, :datetime
    add_index :categories, :discarded_at

    add_column :brands, :discarded_at, :datetime
    add_index :brands, :discarded_at
  end
end

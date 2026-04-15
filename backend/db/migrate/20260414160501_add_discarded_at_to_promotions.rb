class AddDiscardedAtToPromotions < ActiveRecord::Migration[7.2]
  def change
    add_column :promotions, :discarded_at, :datetime
    add_index :promotions, :discarded_at
  end
end

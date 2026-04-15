class AddDiscardedAtToBanners < ActiveRecord::Migration[7.2]
  def change
    add_column :banners, :discarded_at, :datetime
    add_index :banners, :discarded_at
  end
end

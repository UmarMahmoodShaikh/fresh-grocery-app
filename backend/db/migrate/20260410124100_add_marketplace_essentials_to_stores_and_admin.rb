class AddMarketplaceEssentialsToStoresAndAdmin < ActiveRecord::Migration[7.2]
  def change
    # 1. Add Store association to AdminUsers
    add_reference :admin_users, :store, foreign_key: true

    # 2. Add operational metadata to Stores
    change_table :stores do |t|
      t.jsonb :opening_hours
      t.decimal :delivery_fee, precision: 10, scale: 2, default: 0.0
      t.decimal :min_order_amount, precision: 10, scale: 2, default: 0.0
      t.string :phone
      t.string :address
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 11, scale: 6
    end
  end
end

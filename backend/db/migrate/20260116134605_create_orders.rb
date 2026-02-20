class CreateOrders < ActiveRecord::Migration[7.2]
  def change
    create_table :orders do |t|
      t.references :user, null: false, foreign_key: true
      t.decimal :total, precision: 10, scale: 2
      t.integer :status, default: 0
      t.text :delivery_address
      t.decimal :delivery_fee, precision: 10, scale: 2

      t.timestamps
    end
  end
end

class CreateAddresses < ActiveRecord::Migration[7.2]
  def change
    create_table :addresses do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :label, null: false, default: 0  # 0=home, 1=work, 2=other
      t.string :street, null: false
      t.string :city, null: false
      t.string :zip_code, null: false
      t.string :country, null: false
      t.decimal :latitude, precision: 10, scale: 4, null: false
      t.decimal :longitude, precision: 11, scale: 4, null: false
      t.boolean :is_default, default: false, null: false

      t.timestamps
    end

    add_index :addresses, [:user_id, :latitude, :longitude], unique: true, name: "index_addresses_on_user_lat_lon"
  end
end

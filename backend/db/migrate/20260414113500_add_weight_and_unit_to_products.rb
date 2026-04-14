class AddWeightAndUnitToProducts < ActiveRecord::Migration[7.2]
  def change
    add_column :products, :weight, :decimal, precision: 10, scale: 2
    add_column :products, :weight_unit, :string
  end
end

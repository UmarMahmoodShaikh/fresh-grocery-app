class AddAddressToOrders < ActiveRecord::Migration[7.2]
  def change
    add_reference :orders, :address, null: true, foreign_key: true
    
    # In a real 100k+ production env, you'd do this via a background job or batch update.
    # Here, we ensure existing data complies before locking it down.
    reversible do |dir|
      dir.up do
        if Order.any? && Address.any?
          default_address_id = Address.first.id
          Order.update_all(address_id: default_address_id)
        end
      end
    end

    change_column_null :orders, :address_id, false
  end
end

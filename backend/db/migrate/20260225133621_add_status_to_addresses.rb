class AddStatusToAddresses < ActiveRecord::Migration[7.2]
  def change
    add_column :addresses, :is_active, :boolean, default: true
  end
end

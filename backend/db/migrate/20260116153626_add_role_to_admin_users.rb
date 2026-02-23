class AddRoleToAdminUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :admin_users, :role, :integer, default: 0, null: false
  end
end

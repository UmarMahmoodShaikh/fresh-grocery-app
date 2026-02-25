class AddFeedbackToOrders < ActiveRecord::Migration[7.2]
  def change
    add_column :orders, :score, :integer
    add_column :orders, :comments, :text
  end
end

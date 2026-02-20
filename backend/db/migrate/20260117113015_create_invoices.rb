class CreateInvoices < ActiveRecord::Migration[7.2]
  def change
    create_table :invoices do |t|
      t.references :order, null: false, foreign_key: true
      t.string :invoice_number
      t.decimal :total
      t.integer :status

      t.timestamps
    end
  end
end

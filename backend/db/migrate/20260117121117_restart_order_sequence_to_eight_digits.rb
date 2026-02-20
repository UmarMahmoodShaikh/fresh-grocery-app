class RestartOrderSequenceToEightDigits < ActiveRecord::Migration[7.2]
  def up
    execute "ALTER SEQUENCE orders_id_seq RESTART WITH 26000001"
    execute "ALTER SEQUENCE invoices_id_seq RESTART WITH 54000001"
  end

  def down
    execute "ALTER SEQUENCE orders_id_seq RESTART WITH 1"
    execute "ALTER SEQUENCE invoices_id_seq RESTART WITH 1"
  end
end

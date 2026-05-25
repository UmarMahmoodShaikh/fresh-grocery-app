class EnablePostgisAndAddBoundaryToStores < ActiveRecord::Migration[7.2]
  def change
    enable_extension "postgis"
    add_column :stores, :boundary, :st_polygon, geographic: true, srid: 4326
    add_index :stores, :boundary, using: :gist
  end
end

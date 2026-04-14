class StoreCategory < ApplicationRecord
  belongs_to :store
  belongs_to :category

  def self.ransackable_attributes(auth_object = nil)
    ["category_id", "created_at", "id", "store_id", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["category", "store"]
  end
end

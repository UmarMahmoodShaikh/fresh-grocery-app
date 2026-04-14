class Cart < ApplicationRecord
  belongs_to :user
  belongs_to :store
  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "id", "store_id", "updated_at", "user_id"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["cart_items", "products", "store", "user"]
  end

  def total_items
    cart_items.sum(:quantity)
  end
end

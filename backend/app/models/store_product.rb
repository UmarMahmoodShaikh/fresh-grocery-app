class StoreProduct < ApplicationRecord
  belongs_to :store
  belongs_to :product

  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :stock, numericality: { greater_than_or_equal_to: 0, only_integer: true }

  def self.ransackable_associations(auth_object = nil)
    ["product", "store"]
  end

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "discount_price", "id", "id_value", "price", "product_id", "stock", "store_id", "updated_at"]
  end
  def effective_price
    discount_price || price
  end

  def in_stock?
    stock.to_i.positive?
  end

  def stock_label
    return "out of stock" if stock.to_i <= 0
    return "low stock item" if stock.to_i < 50
    "in stock"
  end
end

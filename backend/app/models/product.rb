class Product < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :brand, optional: true
  has_many :order_items
  has_many :orders, through: :order_items

  validates :name, presence: true
  validates :barcode, uniqueness: true, allow_nil: true

  # Ransack configuration for ActiveAdmin search
  def self.ransackable_attributes(auth_object = nil)
    ["barcode", "brand_id", "category_id", "created_at", "description", "id", "image_url", "name", "price", "stock", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["brand", "category", "order_items", "orders"]
  end

  def stock_label
    return "out of stock" if stock.to_i <= 0
    return "low stock item" if stock.to_i < 50
    "in stock"
  end
end

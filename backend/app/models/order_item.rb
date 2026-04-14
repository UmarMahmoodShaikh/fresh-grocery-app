class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :product

  before_validation :capture_price_snapshot, on: :create

  validates :quantity, presence: true,
                       numericality: { greater_than: 0, only_integer: true }
  validates :price, presence: true,
                    numericality: { greater_than_or_equal_to: 0 }

  # Ransack configuration for ActiveAdmin search
  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "id", "order_id", "price", "promotion_price", "product_id", "quantity", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["order", "product"]
  end

  private

  def capture_price_snapshot
    return unless order&.store_id && product_id

    store_product = StoreProduct.find_by(store_id: order.store_id, product_id: product_id)
    if store_product
      self.price = store_product.price
      self.promotion_price = store_product.discount_price
    end
  end
end

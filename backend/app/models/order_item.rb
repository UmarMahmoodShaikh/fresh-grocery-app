class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :product

  validates :quantity, presence: true,
                       numericality: { greater_than: 0, only_integer: true }
  validates :price, presence: true,
                    numericality: { greater_than_or_equal_to: 0 }

  # Ransack configuration for ActiveAdmin search
  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "id", "order_id", "price", "product_id", "quantity", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["order", "product"]
  end
end

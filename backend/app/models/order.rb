class Order < ApplicationRecord
  belongs_to :user
  has_many :order_items, dependent: :destroy
  has_one :invoice, dependent: :destroy
  has_many :products, through: :order_items

  enum :status, { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: 4 }

  # Ransack configuration for ActiveAdmin search
  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "delivery_address", "delivery_fee", "id", "status", "total", "updated_at", "user_id"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["order_items", "products", "user"]
  end
end

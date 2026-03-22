class Product < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :brand, optional: true
  has_many :order_items
  has_many :orders, through: :order_items

  validates :name, presence: true, length: { maximum: 255 }
  validates :barcode, uniqueness: true, allow_nil: true
  validates :price, numericality: { greater_than: 0 }, allow_nil: true
  validates :stock, numericality: { greater_than_or_equal_to: 0, only_integer: true }, allow_nil: true

  # Ransack configuration for ActiveAdmin search
  def self.ransackable_attributes(auth_object = nil)
    ["barcode", "brand_id", "category_id", "created_at", "description", "id", "image_url", "name", "price", "stock", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["brand", "category", "order_items", "orders"]
  end

  include AlgoliaSearch

  algoliasearch index_name: "Product", disable_indexing: Rails.env.test? do
    attributes :name, :description, :price, :stock, :image_url, :barcode
    attribute :category_name do
      category&.name
    end
    attribute :brand_name do
      brand&.name
    end

    searchableAttributes ['name', 'description', 'category_name', 'brand_name']
    customRanking ['desc(stock)']
  end

  def stock_label
    return "out of stock" if stock.to_i <= 0
    return "low stock item" if stock.to_i < 50
    "in stock"
  end
end

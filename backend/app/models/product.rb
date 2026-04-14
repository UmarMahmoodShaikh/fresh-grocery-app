class Product < ApplicationRecord
  include Discard::Model
  belongs_to :category, optional: true
  belongs_to :brand, optional: true
  has_many :order_items
  has_many :orders, through: :order_items
  has_many :store_products, dependent: :destroy
  has_many :stores, through: :store_products

  has_one_attached :image
  validates :image, content_type: ['image/png', 'image/jpeg'],
                    size: { less_than: 5.megabytes , message: 'is too large (max 5MB)' }

  WEIGHT_UNITS = [
    ['Grams (g)', 'g'],
    ['Kilograms (kg)', 'kg'],
    ['Millilitres (ml)', 'ml'],
    ['Litres (L)', 'L'],
    ['Centilitres (cl)', 'cl'],
    ['Pieces', 'pcs'],
    ['Pack', 'pack']
  ].freeze

  validates :name, presence: true, length: { maximum: 255 }
  validates :barcode, uniqueness: true, allow_nil: true
  validates :price, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :stock, numericality: { greater_than_or_equal_to: 0, only_integer: true }, allow_nil: true
  validates :weight, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :weight_unit, inclusion: { in: WEIGHT_UNITS.map(&:last) }, allow_nil: true

  # Ransack configuration for ActiveAdmin search
  def self.ransackable_attributes(auth_object = nil)
    ["barcode", "brand_id", "category_id", "created_at", "description", "id", "image_url", "name", "price", "stock", "updated_at", "weight", "weight_unit"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["brand", "category", "order_items", "orders", "store_products", "stores"]
  end

  include AlgoliaSearch

  algoliasearch index_name: "Product", disable_indexing: Rails.env.test? || (Rails.env.development? && (ENV["ALGOLIA_APPLICATION_ID"].blank? || ENV["ALGOLIA_APPLICATION_ID"] == 'xxxxxxxx')) do
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

  def display_weight
    return nil unless weight.present? && weight_unit.present?
    
    # Clean up trailing zeros: 500.0 -> 500
    formatted_weight = weight.to_f == weight.to_i ? weight.to_i : weight.to_f
    "#{formatted_weight} #{weight_unit}"
  end
end

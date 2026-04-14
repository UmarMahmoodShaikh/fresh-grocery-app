class Store < ApplicationRecord
  include Discard::Model
  has_many :store_products, dependent: :destroy
  has_many :products, through: :store_products
  has_many :store_categories, dependent: :destroy
  has_many :categories, through: :store_categories
  has_many :carts, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_many :promotions, dependent: :destroy
  has_many :banners, dependent: :destroy
  has_many :admin_users, dependent: :nullify
  
  has_one_attached :logo
  has_one_attached :banner
  
  validates :logo, content_type: ['image/png', 'image/jpeg'], size: { less_than: 2.megabytes }
  validates :banner, content_type: ['image/png', 'image/jpeg'], size: { less_than: 5.megabytes }

  validates :name, :slug, presence: true
  validates :slug, uniqueness: true

  def open?
    # Logic for opening_hours (JSON) can be added here
    true 
  end

  before_validation :generate_slug, on: :create

  def self.ransackable_attributes(auth_object = nil)
    ["active", "address", "banner_url", "created_at", "delivery_fee", "id", "latitude", "logo_url", "longitude", "min_order_amount", "name", "phone", "slug", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["admin_users", "banners", "carts", "categories", "orders", "products", "promotions", "store_categories", "store_products"]
  end

  private

  def generate_slug
    self.slug ||= name.parameterize if name
  end
end

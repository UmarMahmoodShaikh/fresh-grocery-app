class Category < ApplicationRecord
  include Discard::Model
  has_many :products
  has_many :subcategories, class_name: "Category", foreign_key: "parent_id", dependent: :destroy
  belongs_to :parent, class_name: "Category", optional: true
  has_many :store_categories, dependent: :destroy
  has_many :stores, through: :store_categories
  
  has_one_attached :image
  validates :image, content_type: ['image/png', 'image/jpeg'], size: { less_than: 2.megabytes }
  validates :name, presence: true, uniqueness: true

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "id", "image_url", "name", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["products"]
  end
end

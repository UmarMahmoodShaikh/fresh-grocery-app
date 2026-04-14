class Brand < ApplicationRecord
  include Discard::Model
  has_many :products
  
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

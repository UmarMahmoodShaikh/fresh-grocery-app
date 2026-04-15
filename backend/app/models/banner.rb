class Banner < ApplicationRecord
  include Discard::Model
  belongs_to :store
  
  has_one_attached :image
  validates :image, content_type: ['image/png', 'image/jpeg'], size: { less_than: 10.megabytes }

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "id", "image_url", "link_url", "store_id", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["store"]
  end
end

class Promotion < ApplicationRecord
  belongs_to :store

  validates :title, presence: true
  
  scope :active, -> { where("starts_at <= ? AND ends_at >= ?", Time.current, Time.current) }

  def self.ransackable_associations(auth_object = nil)
    ["store"]
  end

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "description", "ends_at", "id", "starts_at", "store_id", "title", "updated_at"]
  end
end

class Address < ApplicationRecord
  belongs_to :user
  has_many :orders, dependent: :restrict_with_error

  enum :label, { home: 0, work: 1, other: 2 }

  # Validations
  validates :street, :city, :zip_code, :country, :latitude, :longitude, :label, presence: true
  validates :latitude, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :longitude, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }
  validate :max_five_addresses, on: :create
  validate :unique_location_per_user

  # Callbacks
  before_save :round_coordinates
  before_save :ensure_single_default
  after_save :invalidate_cache
  after_update :invalidate_cache, if: :saved_change_to_is_active?
  after_destroy :invalidate_cache

  # Scopes
  scope :active, -> { where(is_active: true) }
  scope :default_address, -> { where(is_default: true).active.first }

  def self.ransackable_attributes(auth_object = nil)
    ["city", "country", "created_at", "id", "is_default", "label", "street", "user_id", "zip_code"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["user"]
  end

  private

  def round_coordinates
    self.latitude = latitude.round(4) if latitude
    self.longitude = longitude.round(4) if longitude
  end

  def max_five_addresses
    if user && user.addresses.where(is_active: true).count >= 5
      errors.add(:base, "You can have a maximum of 5 active addresses")
    end
  end

  def unique_location_per_user
    return unless user && latitude && longitude

    rounded_lat = latitude.round(4)
    rounded_lon = longitude.round(4)

    existing = user.addresses.where(is_active: true)
      .where("ROUND(latitude::numeric, 4) = ? AND ROUND(longitude::numeric, 4) = ?", rounded_lat, rounded_lon)
    
    # Exclude self when updating
    existing = existing.where.not(id: id) if persisted?

    if existing.exists?
      errors.add(:base, "You already have an address at this location")
    end
  end

  def ensure_single_default
    return unless is_default

    # Unset other defaults for this user
    user.addresses.where(is_default: true).where.not(id: id).update_all(is_default: false)
  end

  def invalidate_cache
    Rails.cache.delete("user_#{user_id}_active_addresses")
    user.addresses.where(is_active: true).pluck(:id).each do |aid|
      Rails.cache.delete("user_#{user_id}_address_#{aid}")
    end
  end
end

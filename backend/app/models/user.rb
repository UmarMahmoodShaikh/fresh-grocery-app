class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :orders
  has_many :addresses, dependent: :destroy

  enum :role, { customer: 0, admin: 1 }

  # Normalize French phone numbers before saving
  before_validation :normalize_phone, if: :phone_changed?

  validates :phone, format: {
    with: /\A\+33[1-9]\d{8}\z/,
    message: "must be a valid French phone number (e.g. 06 12 34 56 78 or +33612345678)"
  }, allow_blank: true

  # Returns phone formatted for display: +33 6 12 34 56 78
  def formatted_phone
    return nil if phone.blank?
    # Format: +33 X XX XX XX XX
    digits = phone.gsub(/\A\+33/, '')
    "+33 #{digits[0]} #{digits[1..2]} #{digits[3..4]} #{digits[5..6]} #{digits[7..8]}"
  end

  # Ransack configuration for ActiveAdmin search
  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "email", "id", "role", "updated_at", "first_name", "last_name", "phone"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["orders", "addresses"]
  end

  private

  # Normalize phone: strip spaces/dashes, convert 0x to +33x
  def normalize_phone
    return if phone.blank?
    
    # Remove all spaces, dashes, dots, and parentheses
    cleaned = phone.gsub(/[\s\-\.\(\)]+/, '')
    
    # Convert French local format (0x) to international (+33x)
    if cleaned.match?(/\A0[1-9]\d{8}\z/)
      cleaned = "+33#{cleaned[1..]}"
    end
    
    # Ensure +33 prefix if just digits starting with 33
    if cleaned.match?(/\A33[1-9]\d{8}\z/)
      cleaned = "+#{cleaned}"
    end
    
    self.phone = cleaned
  end
end


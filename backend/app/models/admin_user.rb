class AdminUser < ApplicationRecord
  belongs_to :store, optional: true # Null for Super Admins
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, 
         :recoverable, :rememberable, :validatable

  enum :role, { 
    employee: 0, 
    super_admin: 1, # Changed from 'admin' to 'super_admin'
    store_admin: 2, 
    store_marketing_manager: 3, 
    store_products_manager: 4 
  }

  delegate :store_products, :promotions, :banners, :orders, :store_categories, to: :store, allow_nil: true

  # Ransack configuration for ActiveAdmin search
  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "email", "id", "role", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["store"]
  end
end

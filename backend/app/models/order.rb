class Order < ApplicationRecord
  belongs_to :user
  belongs_to :address
  has_many :order_items, dependent: :destroy
  has_one :invoice, dependent: :destroy
  has_many :products, through: :order_items

  enum :status, { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: 4 }

  validates :total, :status, presence: true
  validates :total, numericality: { greater_than_or_equal_to: 0 }

  after_create_commit :send_order_created_email
  after_update_commit :send_status_emails, if: :saved_change_to_status?

  # Ransack configuration for ActiveAdmin search
  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "delivery_address", "delivery_fee", "id", "status", "total", "updated_at", "user_id", "score", "comments"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["order_items", "products", "user"]
  end

  private

  def send_order_created_email
    OrderMailer.order_created(self).deliver_later
  end

  def send_status_emails
    begin
      case status
      when "shipped"
        OrderMailer.order_shipped(self).deliver_later
      when "delivered"
        OrderMailer.order_delivered(self).deliver_later
      end
    rescue => e
      Rails.logger.error "Failed to send status email for Order #{id}: #{e.message}"
    end
  end
end

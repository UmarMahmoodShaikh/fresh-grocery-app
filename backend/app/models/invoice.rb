class Invoice < ApplicationRecord
  belongs_to :order
  enum :status, { unpaid: 0, paid: 1, cancelled: 2 }

  before_validation :generate_invoice_number, on: :create

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "id", "invoice_number", "order_id", "status", "total", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["order"]
  end

  private

  def generate_invoice_number
    self.invoice_number = "INV-#{SecureRandom.hex(4).upcase}-#{Time.now.to_i}"
  end
end

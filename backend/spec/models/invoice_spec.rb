require 'rails_helper'

RSpec.describe Invoice, type: :model do
  let(:user) { User.create!(email: 'inv_user@example.com', password: 'password') }
  let(:brand) { Brand.create!(name: 'InvBrand') }
  let(:address) do
    Address.create!(
      user: user, label: :home, street: '10 Rue de Rivoli', city: 'Paris',
      zip_code: '75001', country: 'France', latitude: 48.8566, longitude: 2.3522
    )
  end
  let(:order) { Order.create!(user: user, address: address, total: 50.0, status: :pending) }

  # ── Associations ─────────────────────────────────────────────────────────────

  describe 'associations' do
    it 'belongs to an order' do
      assoc = described_class.reflect_on_association(:order)
      expect(assoc.macro).to eq :belongs_to
    end
  end

  # ── Enum ─────────────────────────────────────────────────────────────────────

  describe 'status enum' do
    it 'defines the correct status values' do
      expect(Invoice.statuses.keys).to match_array(%w[unpaid paid cancelled])
    end
  end

  # ── Validations ──────────────────────────────────────────────────────────────

  describe 'validations' do
    it 'is invalid without a total' do
      invoice = Invoice.new(order: order, status: :unpaid)
      expect(invoice).not_to be_valid
      expect(invoice.errors[:total]).to include("can't be blank")
    end

    it 'is invalid with a negative total' do
      invoice = Invoice.new(order: order, total: -10.0, status: :unpaid)
      expect(invoice).not_to be_valid
      expect(invoice.errors[:total]).to include('must be greater than or equal to 0')
    end

    it 'is valid with total of 0 (full discount/refund)' do
      invoice = Invoice.new(order: order, total: 0, status: :unpaid)
      expect(invoice).to be_valid
    end
  end

  # ── Invoice number generation ─────────────────────────────────────────────────

  describe '#invoice_number' do
    it 'is auto-generated on create' do
      invoice = Invoice.create!(order: order, total: 50.0, status: :unpaid)
      expect(invoice.invoice_number).to be_present
    end

    it 'matches the INV-XXXX-TIMESTAMP format' do
      invoice = Invoice.create!(order: order, total: 50.0, status: :unpaid)
      expect(invoice.invoice_number).to match(/\AINV-[A-F0-9]{8}-\d+\Z/)
    end

    it 'is unique across invoices' do
      # Second order needed to bypass order's unique invoice constraint
      order2 = Order.create!(user: user, address: address, total: 30.0, status: :pending)
      inv1 = Invoice.create!(order: order, total: 50.0, status: :unpaid)
      inv2 = Invoice.create!(order: order2, total: 30.0, status: :unpaid)
      expect(inv1.invoice_number).not_to eq(inv2.invoice_number)
    end
  end
end

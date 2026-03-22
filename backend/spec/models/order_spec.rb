require 'rails_helper'

describe Order, type: :model do
  let(:user) { User.create!(email: 'order_user@example.com', password: 'password') }
  let(:address) do
    Address.create!(
      user: user, label: :home, street: '1 Rue de la Paix', city: 'Paris',
      zip_code: '75001', country: 'France', latitude: 48.8566, longitude: 2.3522
    )
  end

  # ── Enums ─────────────────────────────────────────────────────────────────────

  it 'defines the correct status enum values' do
    expect(Order.statuses.keys).to match_array(%w[pending processing shipped delivered cancelled])
  end

  # ── Associations ──────────────────────────────────────────────────────────────

  describe 'associations' do
    it 'belongs to a user' do
      expect(described_class.reflect_on_association(:user).macro).to eq :belongs_to
    end

    it 'belongs to an address' do
      expect(described_class.reflect_on_association(:address).macro).to eq :belongs_to
    end

    it 'has many order_items' do
      expect(described_class.reflect_on_association(:order_items).macro).to eq :has_many
    end

    it 'has one invoice' do
      expect(described_class.reflect_on_association(:invoice).macro).to eq :has_one
    end
  end

  # ── Validations ───────────────────────────────────────────────────────────────

  describe 'validations' do
    it 'is valid with valid attributes' do
      order = Order.new(user: user, address: address, total: 100.0, status: :pending)
      expect(order).to be_valid
    end

    it 'is invalid without a total' do
      order = Order.new(user: user, address: address, total: nil, status: :pending)
      expect(order).not_to be_valid
      expect(order.errors[:total]).to include("can't be blank")
    end

    it 'is invalid with a negative total' do
      order = Order.new(user: user, address: address, total: -5.0, status: :pending)
      expect(order).not_to be_valid
      expect(order.errors[:total]).to include('must be greater than or equal to 0')
    end

    it 'is valid with total of 0 (fully promotional)' do
      order = Order.new(user: user, address: address, total: 0, status: :pending)
      expect(order).to be_valid
    end

    it 'is invalid without a status' do
      order = Order.new(user: user, address: address, total: 10.0, status: nil)
      expect(order).not_to be_valid
    end
  end

  # ── Status transitions ────────────────────────────────────────────────────────

  describe 'status transitions' do
    let(:order) { Order.create!(user: user, address: address, total: 50.0, status: :pending) }

    it 'can transition from pending to processing' do
      order.update!(status: :processing)
      expect(order.reload.status).to eq('processing')
    end

    it 'can transition to cancelled' do
      order.update!(status: :cancelled)
      expect(order.reload.status).to eq('cancelled')
    end

    it 'raises ArgumentError for an invalid status' do
      expect { order.status = :invalid_status }.to raise_error(ArgumentError)
    end
  end
end

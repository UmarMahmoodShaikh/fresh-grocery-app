require 'rails_helper'

RSpec.describe OrderItem, type: :model do
  let(:user) { User.create!(email: 'u@example.com', password: 'password') }
  let(:brand) { Brand.create!(name: 'BrandX') }
  let(:product) { Product.create!(name: 'Apple', price: 1.5, stock: 100, brand: brand) }
  let(:address) do
    Address.create!(
      user: user, label: :home, street: '1 Main St', city: 'Paris',
      zip_code: '75001', country: 'France', latitude: 48.8566, longitude: 2.3522
    )
  end
  let(:order) { Order.create!(user: user, address: address, total: 10.0, status: :pending) }

  describe 'associations' do
    it 'belongs to an order' do
      assoc = described_class.reflect_on_association(:order)
      expect(assoc.macro).to eq :belongs_to
    end

    it 'belongs to a product' do
      assoc = described_class.reflect_on_association(:product)
      expect(assoc.macro).to eq :belongs_to
    end
  end

  describe 'validations' do
    it 'is valid with valid attributes' do
      item = OrderItem.new(order: order, product: product, quantity: 2, price: 1.5)
      expect(item).to be_valid
    end

    it 'is invalid without quantity' do
      item = OrderItem.new(order: order, product: product, quantity: nil, price: 1.5)
      expect(item).not_to be_valid
      expect(item.errors[:quantity]).to include("can't be blank")
    end

    it 'is invalid with zero quantity' do
      item = OrderItem.new(order: order, product: product, quantity: 0, price: 1.5)
      expect(item).not_to be_valid
      expect(item.errors[:quantity]).to include('must be greater than 0')
    end

    it 'is invalid with a negative quantity' do
      item = OrderItem.new(order: order, product: product, quantity: -1, price: 1.5)
      expect(item).not_to be_valid
    end

    it 'is invalid with a non-integer quantity' do
      item = OrderItem.new(order: order, product: product, quantity: 1.5, price: 1.0)
      expect(item).not_to be_valid
      expect(item.errors[:quantity]).to include('must be an integer')
    end

    it 'is invalid without price' do
      item = OrderItem.new(order: order, product: product, quantity: 1, price: nil)
      expect(item).not_to be_valid
      expect(item.errors[:price]).to include("can't be blank")
    end

    it 'is invalid with a negative price' do
      item = OrderItem.new(order: order, product: product, quantity: 1, price: -0.01)
      expect(item).not_to be_valid
      expect(item.errors[:price]).to include('must be greater than or equal to 0')
    end

    it 'allows price of 0 (promotional/free items)' do
      item = OrderItem.new(order: order, product: product, quantity: 1, price: 0)
      expect(item).to be_valid
    end
  end
end

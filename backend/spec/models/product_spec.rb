require 'rails_helper'

RSpec.describe Product, type: :model do
  let(:brand) { Brand.create!(name: 'TestBrand') }

  # ── Associations ─────────────────────────────────────────────────────────────

  describe 'associations' do
    it 'has many order_items' do
      expect(described_class.reflect_on_association(:order_items).macro).to eq :has_many
    end

    it 'has many orders through order_items' do
      assoc = described_class.reflect_on_association(:orders)
      expect(assoc.macro).to eq :has_many
      expect(assoc.options[:through]).to eq :order_items
    end

    it 'belongs to brand (optional)' do
      assoc = described_class.reflect_on_association(:brand)
      expect(assoc.macro).to eq :belongs_to
    end
  end

  # ── Validations ──────────────────────────────────────────────────────────────

  describe 'validations' do
    it 'is valid with all required attributes' do
      product = Product.new(name: 'Banana', price: 1.5, stock: 100, brand: brand)
      expect(product).to be_valid
    end

    it 'is invalid without a name' do
      product = Product.new(name: nil, price: 1.5, stock: 10)
      expect(product).not_to be_valid
      expect(product.errors[:name]).to include("can't be blank")
    end

    it 'rejects a name longer than 255 characters' do
      product = Product.new(name: 'A' * 256, price: 1.5, stock: 10)
      expect(product).not_to be_valid
      expect(product.errors[:name]).to include('is too long (maximum is 255 characters)')
    end

    it 'rejects a negative price' do
      product = Product.new(name: 'Apple', price: -1, stock: 10)
      expect(product).not_to be_valid
      expect(product.errors[:price]).to include('must be greater than 0')
    end

    it 'rejects price of zero' do
      product = Product.new(name: 'Apple', price: 0, stock: 10)
      expect(product).not_to be_valid
    end

    it 'rejects negative stock' do
      product = Product.new(name: 'Apple', price: 1.5, stock: -1)
      expect(product).not_to be_valid
      expect(product.errors[:stock]).to include('must be greater than or equal to 0')
    end

    it 'rejects non-integer stock' do
      product = Product.new(name: 'Apple', price: 1.5, stock: 1.5)
      expect(product).not_to be_valid
      expect(product.errors[:stock]).to include('must be an integer')
    end

    it 'enforces barcode uniqueness' do
      Product.create!(name: 'A', barcode: '123', price: 1.0, stock: 10, brand: brand)
      dup = Product.new(name: 'B', barcode: '123', price: 2.0, stock: 5, brand: brand)
      expect(dup).not_to be_valid
      expect(dup.errors[:barcode]).to include('has already been taken')
    end

    it 'allows nil barcode (product may not have one)' do
      product = Product.new(name: 'Bulk Apple', price: 1.5, stock: 10, barcode: nil, brand: brand)
      expect(product).to be_valid
    end
  end

  # ── stock_label ───────────────────────────────────────────────────────────────

  describe '#stock_label' do
    it 'returns "out of stock" when stock is 0' do
      product = Product.new(stock: 0)
      expect(product.stock_label).to eq('out of stock')
    end

    it 'returns "out of stock" when stock is nil' do
      product = Product.new(stock: nil)
      expect(product.stock_label).to eq('out of stock')
    end

    it 'returns "low stock item" when stock is between 1 and 49' do
      product = Product.new(stock: 25)
      expect(product.stock_label).to eq('low stock item')
    end

    it 'returns "in stock" when stock is 50 or more' do
      product = Product.new(stock: 100)
      expect(product.stock_label).to eq('in stock')
    end

    it 'returns "in stock" exactly at the boundary (50)' do
      product = Product.new(stock: 50)
      expect(product.stock_label).to eq('in stock')
    end
  end
end

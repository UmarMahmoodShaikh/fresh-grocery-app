require 'rails_helper'

RSpec.describe Brand, type: :model do
  describe 'validations' do
    it 'is valid with a unique name' do
      brand = Brand.new(name: 'Nestlé')
      expect(brand).to be_valid
    end

    it 'is invalid without a name' do
      brand = Brand.new(name: nil)
      expect(brand).not_to be_valid
      expect(brand.errors[:name]).to include("can't be blank")
    end

    it 'is invalid with a duplicate name' do
      Brand.create!(name: 'Nestlé')
      duplicate = Brand.new(name: 'Nestlé')
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:name]).to include('has already been taken')
    end
  end

  describe 'associations' do
    it 'has many products' do
      assoc = described_class.reflect_on_association(:products)
      expect(assoc.macro).to eq :has_many
    end
  end

  describe 'ransackable configuration' do
    it 'allows expected attributes' do
      expect(Brand.ransackable_attributes).to include('name', 'id')
    end
  end
end

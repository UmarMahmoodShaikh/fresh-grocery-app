require 'rails_helper'

RSpec.describe Category, type: :model do
  describe 'validations' do
    it 'is valid with a unique name' do
      category = Category.new(name: 'Dairy')
      expect(category).to be_valid
    end

    it 'is invalid without a name' do
      category = Category.new(name: nil)
      expect(category).not_to be_valid
      expect(category.errors[:name]).to include("can't be blank")
    end

    it 'is invalid with a duplicate name' do
      Category.create!(name: 'Dairy')
      duplicate = Category.new(name: 'Dairy')
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
      expect(Category.ransackable_attributes).to include('name', 'id')
    end
  end
end

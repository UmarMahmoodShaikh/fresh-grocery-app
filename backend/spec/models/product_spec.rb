require 'rails_helper'

RSpec.describe Product, type: :model do
  it 'has many order_items' do
    assoc = described_class.reflect_on_association(:order_items)
    expect(assoc.macro).to eq :has_many
  end

  it 'has many orders through order_items' do
    assoc = described_class.reflect_on_association(:orders)
    expect(assoc.macro).to eq :has_many
    expect(assoc.options[:through]).to eq :order_items
  end
end

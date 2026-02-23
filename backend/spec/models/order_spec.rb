require 'rails_helper'

describe Order, type: :model do
  it 'defines the correct status enum values' do
    expect(Order.statuses.keys).to match_array(%w[pending processing shipped delivered cancelled])
  end

  it 'has proper associations' do
    assoc = described_class.reflect_on_association(:user)
    expect(assoc.macro).to eq :belongs_to

    assoc_items = described_class.reflect_on_association(:order_items)
    expect(assoc_items.macro).to eq :has_many

    assoc_invoice = described_class.reflect_on_association(:invoice)
    expect(assoc_invoice.macro).to eq :has_one
  end
end

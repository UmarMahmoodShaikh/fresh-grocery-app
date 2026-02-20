require 'rails_helper'

RSpec.describe Invoice, type: :model do
  it 'belongs to an order' do
    assoc = described_class.reflect_on_association(:order)
    expect(assoc.macro).to eq :belongs_to
  end

  it 'defines the correct status enum' do
    expect(Invoice.statuses.keys).to match_array(%w[unpaid paid cancelled])
  end
end

require 'rails_helper'

describe User, type: :model do
  it 'has correct role enum' do
    expect(User.roles.keys).to match_array(%w[customer admin guest])
  end

  it 'has many orders' do
    assoc = described_class.reflect_on_association(:orders)
    expect(assoc.macro).to eq :has_many
  end
end

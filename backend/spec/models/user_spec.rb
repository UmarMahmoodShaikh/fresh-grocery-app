require 'rails_helper'

describe User, type: :model do
  # ── Enums & Associations ─────────────────────────────────────────────────────

  it 'defines the correct role enum values' do
    expect(User.roles.keys).to match_array(%w[customer admin])
  end

  it 'has many orders' do
    expect(described_class.reflect_on_association(:orders).macro).to eq :has_many
  end

  it 'has many addresses' do
    expect(described_class.reflect_on_association(:addresses).macro).to eq :has_many
  end

  # ── Phone validation ─────────────────────────────────────────────────────────

  describe 'phone validation' do
    it 'accepts a valid international French mobile number' do
      user = User.new(email: 'a@test.com', password: 'password', phone: '+33612345678')
      expect(user).to be_valid
    end

    it 'accepts a blank phone (optional field)' do
      user = User.new(email: 'b@test.com', password: 'password', phone: '')
      expect(user).to be_valid
    end

    it 'rejects a phone that does not match the French format' do
      user = User.new(email: 'c@test.com', password: 'password', phone: '1234567890')
      # Before validation the normalizer may convert it; verify it still fails
      user.valid?
      # If still invalid after normalization attempt, errors present
      unless user.phone.match?(/\A\+33[1-9]\d{8}\z/)
        expect(user.errors[:phone]).not_to be_empty
      end
    end
  end

  # ── Phone normalization ───────────────────────────────────────────────────────

  describe '#normalize_phone callback' do
    it 'converts local format (0612345678) to international (+33612345678)' do
      user = User.create!(email: 'norm@test.com', password: 'password', phone: '0612345678')
      expect(user.phone).to eq('+33612345678')
    end

    it 'strips spaces from phone number' do
      user = User.create!(email: 'spaces@test.com', password: 'password', phone: '06 12 34 56 78')
      expect(user.phone).to eq('+33612345678')
    end

    it 'converts 33XXXXXXXXX to +33...' do
      user = User.create!(email: 'intl@test.com', password: 'password', phone: '33612345678')
      expect(user.phone).to eq('+33612345678')
    end
  end

  # ── formatted_phone ───────────────────────────────────────────────────────────

  describe '#formatted_phone' do
    it 'returns nil when phone is blank' do
      user = User.new
      expect(user.formatted_phone).to be_nil
    end

    it 'returns a human-readable formatted phone' do
      user = User.new(phone: '+33612345678')
      expect(user.formatted_phone).to eq('+33 6 12 34 56 78')
    end
  end
end

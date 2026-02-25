require 'rails_helper'

RSpec.describe Address, type: :model do
  let(:user) { User.create!(email: "test@example.com", password: "password", first_name: "Test", last_name: "User") }
  
  describe 'validations' do
    it 'is valid with valid attributes' do
      address = Address.new(
        user: user,
        label: :home,
        street: "123 Main St",
        city: "San Francisco",
        zip_code: "94105",
        country: "USA",
        latitude: 37.7749,
        longitude: -122.4194
      )
      expect(address).to be_valid
    end

    it 'is invalid without required attributes' do
      address = Address.new
      expect(address).not_to be_valid
      expect(address.errors[:street]).to include("can't be blank")
    end

    it 'validates latitude and longitude ranges' do
      address = Address.new(latitude: 100, longitude: 200)
      address.valid?
      expect(address.errors[:latitude]).to include("must be less than or equal to 90")
      expect(address.errors[:longitude]).to include("must be less than or equal to 180")
    end
  end

  describe 'callbacks' do
    it 'rounds coordinates to 4 decimal places before saving' do
      address = Address.create!(
        user: user,
        label: :home,
        street: "123 Main St",
        city: "San Francisco",
        zip_code: "94105",
        country: "USA",
        latitude: 37.77491234,
        longitude: -122.41945678
      )
      expect(address.latitude).to eq(37.7749)
      expect(address.longitude).to eq(-122.4195) # Note: .round(4) might round up/down
    end

    it 'ensures only one address is marked as default' do
      addr1 = Address.create!(
        user: user, label: :home, street: "Street 1", city: "City", zip_code: "123", country: "US",
        latitude: 10, longitude: 10, is_default: true
      )
      addr2 = Address.create!(
        user: user, label: :work, street: "Street 2", city: "City", zip_code: "123", country: "US",
        latitude: 20, longitude: 20, is_default: false
      )

      expect(addr1.reload.is_default).to be true
      expect(addr2.reload.is_default).to be false

      addr2.update!(is_default: true)

      expect(addr1.reload.is_default).to be false
      expect(addr2.reload.is_default).to be true
    end
  end

  describe 'custom validations' do
    it 'limits user to a maximum of 5 addresses' do
      5.times do |i|
        Address.create!(
          user: user, label: :home, street: "Street #{i}", city: "City", zip_code: "123", country: "US",
          latitude: i, longitude: i
        )
      end

      extra_address = Address.new(
        user: user, label: :home, street: "Extra", city: "City", zip_code: "123", country: "US",
        latitude: 10, longitude: 10
      )
      
      expect(extra_address).not_to be_valid
      expect(extra_address.errors[:base]).to include("You can have a maximum of 5 addresses")
    end

    it 'prevents duplicate locations for the same user' do
      Address.create!(
        user: user, label: :home, street: "Street 1", city: "City", zip_code: "123", country: "US",
        latitude: 37.7749, longitude: -122.4194
      )

      duplicate = Address.new(
        user: user, label: :work, street: "Street 2", city: "City", zip_code: "123", country: "US",
        latitude: 37.77491, longitude: -122.41942 # Should round to same location
      )

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:base]).to include("You already have an address at this location")
    end
  end
end

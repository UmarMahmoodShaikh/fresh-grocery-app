require 'rails_helper'

RSpec.describe 'Addresses API', type: :request do
  let!(:user) { User.create!(email: 'addr_user@example.com', password: 'password', role: :customer) }
  let!(:other_user) { User.create!(email: 'other@example.com', password: 'password', role: :customer) }

  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  let(:valid_address_params) do
    {
      address: {
        label: 'home',
        street: '1 Rue de Rivoli',
        city: 'Paris',
        zip_code: '75001',
        country: 'France',
        latitude: 48.8566,
        longitude: 2.3522
      }
    }
  end

  let!(:address) do
    Address.create!(
      user: user, label: :home, street: '1 Rue de Rivoli', city: 'Paris',
      zip_code: '75001', country: 'France', latitude: 48.8566, longitude: 2.3522,
      is_default: true
    )
  end

  # ── Authentication guards ─────────────────────────────────────────────────────

  describe 'without a token' do
    it 'returns 401 for GET /api/v1/addresses' do
      get '/api/v1/addresses'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 401 for POST /api/v1/addresses' do
      post '/api/v1/addresses', params: valid_address_params
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # ── Index ─────────────────────────────────────────────────────────────────────

  describe 'GET /api/v1/addresses' do
    it 'returns the authenticated user\'s active addresses' do
      get '/api/v1/addresses', headers: headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to be_an(Array)
      ids = json.map { |a| a['id'] }
      expect(ids).to include(address.id)
    end

    it 'does not return other users\' addresses' do
      other_addr = Address.create!(
        user: other_user, label: :home, street: '2 Rue Test',
        city: 'Lyon', zip_code: '69000', country: 'France',
        latitude: 45.75, longitude: 4.85
      )
      get '/api/v1/addresses', headers: headers
      json = JSON.parse(response.body)
      expect(json.map { |a| a['id'] }).not_to include(other_addr.id)
    end

    it 'does not return inactive addresses' do
      address.update!(is_active: false)
      get '/api/v1/addresses', headers: headers
      json = JSON.parse(response.body)
      expect(json.map { |a| a['id'] }).not_to include(address.id)
    end
  end

  # ── Create ────────────────────────────────────────────────────────────────────

  describe 'POST /api/v1/addresses' do
    let(:new_address_params) do
      {
        address: {
          label: 'work',
          street: '10 Avenue des Champs-Élysées',
          city: 'Paris',
          zip_code: '75008',
          country: 'France',
          latitude: 48.8698,
          longitude: 2.3078
        }
      }
    end

    it 'creates a new address for the user' do
      expect {
        post '/api/v1/addresses', params: new_address_params, headers: headers
      }.to change(Address, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it 'auto-sets the first address as default' do
      # Remove existing address first
      address.destroy
      user.reload
      post '/api/v1/addresses', params: valid_address_params, headers: headers
      json = JSON.parse(response.body)
      expect(json['is_default']).to be true
    end

    it 'returns 422 when address is invalid (missing street)' do
      invalid_params = { address: { label: 'home', city: 'Paris', zip_code: '75001', country: 'France', latitude: 48.8, longitude: 2.35 } }
      post '/api/v1/addresses', params: invalid_params, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  # ── Show ──────────────────────────────────────────────────────────────────────

  describe 'GET /api/v1/addresses/:id' do
    it 'returns the address' do
      get "/api/v1/addresses/#{address.id}", headers: headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(address.id)
    end

    it 'returns 404 for a non-existent address' do
      get '/api/v1/addresses/99999999', headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  # ── Update ────────────────────────────────────────────────────────────────────

  describe 'PATCH /api/v1/addresses/:id' do
    it 'updates the address' do
      patch "/api/v1/addresses/#{address.id}",
            params: { address: { street: 'New Street 1' } },
            headers: headers
      expect(response).to have_http_status(:ok)
      expect(address.reload.street).to eq('New Street 1')
    end

    it 'returns 404 when updating non-existent address' do
      patch '/api/v1/addresses/99999999',
            params: { address: { street: 'X' } },
            headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  # ── Destroy ───────────────────────────────────────────────────────────────────

  describe 'DELETE /api/v1/addresses/:id' do
    it 'soft-deletes the address (sets is_active to false)' do
      delete "/api/v1/addresses/#{address.id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(address.reload.is_active).to be false
    end

    it 'returns 404 for a non-existent address' do
      delete '/api/v1/addresses/99999999', headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  # ── Set Default ───────────────────────────────────────────────────────────────

  describe 'PATCH /api/v1/addresses/:id/set_default' do
    let!(:address2) do
      Address.create!(
        user: user, label: :work, street: '2 Rue Test',
        city: 'Lyon', zip_code: '69000', country: 'France',
        latitude: 45.75, longitude: 4.85, is_default: false
      )
    end

    it 'sets the specified address as default and unsets others' do
      patch "/api/v1/addresses/#{address2.id}/set_default", headers: headers
      expect(response).to have_http_status(:ok)
      expect(address2.reload.is_default).to be true
      expect(address.reload.is_default).to be false
    end
  end
end

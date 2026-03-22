require 'rails_helper'

RSpec.describe 'Brands API', type: :request do
  let!(:brand1) { Brand.create!(name: 'Nestlé') }
  let!(:brand2) { Brand.create!(name: 'Danone') }

  # ── Index ─────────────────────────────────────────────────────────────────────

  describe 'GET /api/v1/brands' do
    it 'returns a list of all brands' do
      get '/api/v1/brands'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to be_an(Array)
      names = json.map { |b| b['name'] }
      expect(names).to include('Nestlé', 'Danone')
    end

    it 'returns ok without authentication (public endpoint)' do
      get '/api/v1/brands'
      expect(response).to have_http_status(:ok)
    end
  end

  # ── Show ──────────────────────────────────────────────────────────────────────

  describe 'GET /api/v1/brands/:id' do
    it 'returns a single brand' do
      get "/api/v1/brands/#{brand1.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(brand1.id)
      expect(json['name']).to eq('Nestlé')
    end

    it 'returns 404 for a non-existent brand' do
      get '/api/v1/brands/99999999'
      expect(response).to have_http_status(:not_found)
    end
  end
end

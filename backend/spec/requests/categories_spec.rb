require 'rails_helper'

RSpec.describe 'Categories API', type: :request do
  let!(:category1) { Category.create!(name: 'Dairy') }
  let!(:category2) { Category.create!(name: 'Bakery') }

  # ── Index ─────────────────────────────────────────────────────────────────────

  describe 'GET /api/v1/categories' do
    it 'returns a list of all categories' do
      get '/api/v1/categories'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to be_an(Array)
      names = json.map { |c| c['name'] }
      expect(names).to include('Dairy', 'Bakery')
    end

    it 'is accessible without authentication' do
      get '/api/v1/categories'
      expect(response).to have_http_status(:ok)
    end
  end

  # ── Show ──────────────────────────────────────────────────────────────────────

  describe 'GET /api/v1/categories/:id' do
    it 'returns a single category' do
      get "/api/v1/categories/#{category1.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(category1.id)
      expect(json['name']).to eq('Dairy')
    end

    it 'returns 404 for a non-existent category' do
      get '/api/v1/categories/99999999'
      expect(response).to have_http_status(:not_found)
    end
  end
end

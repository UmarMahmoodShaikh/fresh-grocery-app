require 'rails_helper'

RSpec.describe 'Products API', type: :request do
  let!(:admin)    { User.create!(email: 'admin2@example.com', password: 'password', role: :admin) }
  let!(:customer) { User.create!(email: 'cust@example.com', password: 'password', role: :customer) }
  let!(:brand)    { Brand.create!(name: 'GenericBrand') }

  let!(:product) do
    Product.create!(
      name:        'Banana',
      brand:       brand,
      stock:       100,
      price:       1.50,
      barcode:     '1234567890123',
      image_url:   'https://example.com/banana.png',
      description: 'Bananas'
    )
  end

  # -------------------------------------------------------------------------
  # Public index – no auth required
  # -------------------------------------------------------------------------
  describe 'GET /api/v1/products' do
    it 'returns a list of products' do
      get '/api/v1/products'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to be_an(Array)
      expect(json.map { |p| p['name'] }).to include('Banana')
      banana = json.find { |p| p['name'] == 'Banana' }
      expect(banana['stock_label']).to eq('in stock')
    end
  end

  # -------------------------------------------------------------------------
  # Show – public
  # -------------------------------------------------------------------------
  describe 'GET /api/v1/products/:id' do
    it 'returns a single product' do
      get "/api/v1/products/#{product.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(product.id)
      expect(json['name']).to eq('Banana')
    end
  end

  # -------------------------------------------------------------------------
  # Admin‑only create / update / destroy
  # -------------------------------------------------------------------------
  context 'admin actions' do
    let(:token) { JWT.encode({ user_id: admin.id }, Rails.application.credentials.secret_key_base) }
    let(:headers) { { 'Authorization' => "Bearer #{token}" } }

    it 'creates a product' do
      expect {
        post '/api/v1/products', params: {
          product: {
            name: 'Apple',
            brand_id: brand.id,
            stock: 50,
            price: 2.0,
            barcode: '9876543210987'
          }
        }, headers: headers
      }.to change(Product, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it 'updates a product' do
      patch "/api/v1/products/#{product.id}", params: { product: { name: 'Banana (ripe)' } }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(product.reload.name).to eq('Banana (ripe)')
    end

    it 'destroys a product' do
      expect {
        delete "/api/v1/products/#{product.id}", headers: headers
      }.to change(Product, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  # -------------------------------------------------------------------------
  # Unauthorized or Non-Admin attempts
  # -------------------------------------------------------------------------
  context 'non‑admin attempts' do
    let(:token) { JWT.encode({ user_id: customer.id }, Rails.application.credentials.secret_key_base) }
    let(:headers) { { 'Authorization' => "Bearer #{token}" } }

    it 'rejects create' do
      post '/api/v1/products', params: { product: { name: 'Pear' } }, headers: headers
      expect(response).to have_http_status(:forbidden)
    end

    it 'rejects update' do
      patch "/api/v1/products/#{product.id}", params: { product: { name: 'X' } }, headers: headers
      expect(response).to have_http_status(:forbidden)
    end

    it 'rejects destroy' do
      delete "/api/v1/products/#{product.id}", headers: headers
      expect(response).to have_http_status(:forbidden)
    end
  end
end

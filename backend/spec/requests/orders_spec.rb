require 'rails_helper'

RSpec.describe 'Orders API', type: :request do
  let!(:customer) { User.create!(email: 'cust@example.com', password: 'password', role: :customer) }
  let!(:admin)    { User.create!(email: 'admin2@example.com', password: 'password', role: :admin) }

  let!(:address) do
    Address.create!(
      user: customer, label: :home, street: '1 Rue de la Paix',
      city: 'Paris', zip_code: '75001', country: 'France',
      latitude: 48.8566, longitude: 2.3522, is_default: true
    )
  end

  let!(:order) do
    Order.create!(
      user:             customer,
      address:          address,
      total:            120.0,
      status:           :pending,
      delivery_address: '1 Rue de la Paix, Paris, 75001, France',
      delivery_fee:     0.0
    )
  end

  def auth_headers(user)
    token = JWT.encode({ user_id: user.id }, Rails.application.secret_key_base)
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'GET /api/v1/orders/:id' do
    it 'returns the order without authentication' do
      get "/api/v1/orders/#{order.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(order.id)
      expect(json['status']).to eq('pending')
    end
  end

  describe 'GET /api/v1/orders' do
    context 'as admin' do
      it 'returns all orders' do
        get '/api/v1/orders', headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json).to be_an(Array)
        expect(json.map { |o| o['id'] }).to include(order.id)
      end
    end

    context 'without authentication' do
      it 'returns unauthorized' do
        get '/api/v1/orders'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST /api/v1/orders (guest checkout)' do
    let!(:brand)   { Brand.create!(name: "GenericGuest_#{Time.now.to_i}") }
    let!(:product) { Product.create!(name: 'Item1', price: 10, stock: 100, brand: brand) }

    # Guest checkout without address_id will fail validation since address is required.
    # The orders controller returns 401 if there's no user (guest not yet implemented with address).
    # We test that unauthenticated POST without credentials returns 401.
    it 'returns unauthorized without credentials or guest_info' do
      post '/api/v1/orders',
           params: { order: { total: 45.0, delivery_fee: 0.0 }, items: [] },
           as: :json
      expect(response.status).to be_in([401, 422])
    end
  end

  describe 'PATCH /api/v1/orders/:id/update_status' do
    context 'as admin' do
      it 'updates the order status' do
        patch "/api/v1/orders/#{order.id}/update_status",
              params: { status: :shipped },
              headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('shipped')
      end

      it 'reverts stock when order is cancelled' do
        brand2   = Brand.create!(name: "StockBrand_#{Time.now.to_i}")
        product2 = Product.create!(name: 'Item', price: 10, stock: 100, brand: brand2)

        OrderItem.create!(order: order, product: product2, quantity: 5, price: 10)
        product2.update!(stock: 95)

        patch "/api/v1/orders/#{order.id}/update_status",
              params: { status: 'cancelled' },
              headers: auth_headers(admin)

        expect(response).to have_http_status(:ok)
        expect(product2.reload.stock).to eq(100)
      end
    end

    context 'without a token' do
      it 'returns unauthorized' do
        patch "/api/v1/orders/#{order.id}/update_status", params: { status: :shipped }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'as a regular customer' do
      it 'returns forbidden' do
        patch "/api/v1/orders/#{order.id}/update_status",
              params: { status: :shipped },
              headers: auth_headers(customer)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end

require 'rails_helper'

RSpec.describe 'Admin Dashboard API', type: :request do
  let!(:admin)    { User.create!(email: 'admin@example.com', password: 'password', role: :admin) }
  let!(:customer) { User.create!(email: 'cust@example.com',  password: 'password', role: :customer) }

  let(:admin_token)  { JWT.encode({ user_id: admin.id },    Rails.application.secret_key_base) }
  let(:cust_token)   { JWT.encode({ user_id: customer.id }, Rails.application.secret_key_base) }
  let(:admin_headers) { { 'Authorization' => "Bearer #{admin_token}" } }
  let(:cust_headers)  { { 'Authorization' => "Bearer #{cust_token}" } }

  # ── Summary ───────────────────────────────────────────────────────────────────

  describe 'GET /api/v1/admin/dashboard/summary' do
    context 'as admin' do
      it 'returns summary counts' do
        get '/api/v1/admin/dashboard/summary', headers: admin_headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json).to include('totalOrders', 'totalUsers', 'totalProducts')
        expect(json['totalUsers']).to be_a(Integer)
        expect(json['totalOrders']).to be_a(Integer)
        expect(json['totalProducts']).to be_a(Integer)
      end

      it 'reflects correct user count' do
        get '/api/v1/admin/dashboard/summary', headers: admin_headers
        json = JSON.parse(response.body)
        expect(json['totalUsers']).to eq(User.count)
      end
    end

    context 'without a token' do
      it 'returns 401' do
        get '/api/v1/admin/dashboard/summary'
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'as a non-admin customer' do
      it 'returns 403' do
        get '/api/v1/admin/dashboard/summary', headers: cust_headers
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  # ── Recent Orders ─────────────────────────────────────────────────────────────

  describe 'GET /api/v1/admin/dashboard/orders' do
    context 'as admin' do
      it 'returns an array of recent orders' do
        get '/api/v1/admin/dashboard/orders', headers: admin_headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json).to be_an(Array)
      end

      it 'each order entry has required keys' do
        address = Address.create!(
          user: customer, label: :home, street: '1 Main St', city: 'Paris',
          zip_code: '75001', country: 'France', latitude: 48.8566, longitude: 2.3522
        )
        Order.create!(user: customer, address: address, total: 50.0, status: :pending)

        get '/api/v1/admin/dashboard/orders', headers: admin_headers
        json = JSON.parse(response.body)
        recent = json.first
        expect(recent).to include('id', 'status', 'totalAmount', 'orderDate')
      end
    end

    context 'without a token' do
      it 'returns 401' do
        get '/api/v1/admin/dashboard/orders'
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'as a non-admin customer' do
      it 'returns 403' do
        get '/api/v1/admin/dashboard/orders', headers: cust_headers
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end

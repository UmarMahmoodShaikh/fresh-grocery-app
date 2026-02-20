require 'rails_helper'

RSpec.describe 'Orders API', type: :request do
  let!(:customer) { User.create!(email: 'cust@example.com', password: 'password', role: :customer) }
  let!(:admin)    { User.create!(email: 'admin2@example.com', password: 'password', role: :admin) }

  let!(:order) do
    Order.create!(
      user:            customer,
      total:           120.0,
      status:          :pending,
      delivery_address: '123 Test St',
      delivery_fee:    0.0
    )
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
      before { allow_any_instance_of(Api::V1::OrdersController)
               .to receive(:current_user).and_return(admin) }

      it 'returns all orders' do
        get '/api/v1/orders'
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
    let(:guest_params) do
      {
        order: {
          total: 45.0,
          status: :pending,
          delivery_address: '99 Guest St',
          delivery_fee: 0.0
        },
        guest_info: {
          email: 'guest@example.com',
          first_name: 'Guest',
          last_name: 'User',
          phone: '555-1234'
        },
        items: [
          { product_id: product.id, quantity: 2, price: 10.0 }
        ]
      }
    end

    it 'creates a guest user and an order' do
      expect {
        post '/api/v1/orders', params: guest_params, as: :json
      }.to change(User, :count).by(1)
       .and change(Order, :count).by(1)
       .and change { product.reload.stock }.by(-2)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['status']).to eq('pending')
      expect(User.find_by(email: 'guest@example.com')).to be_present
    end
  end

  describe 'PATCH /api/v1/orders/:id/update_status' do
    before { allow_any_instance_of(Api::V1::OrdersController)
             .to receive(:current_user).and_return(admin) }

    it 'updates the order status' do
      patch "/api/v1/orders/#{order.id}/update_status", params: { status: :shipped }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['status']).to eq('shipped')
    end
  end

  describe 'PATCH /api/v1/orders/:id/update_status (unauth)' do
    it 'rejects non-admin users' do
      patch "/api/v1/orders/#{order.id}/update_status", params: { status: :shipped }
      expect(response).to have_http_status(:forbidden)
      it 'reverts stock when order is cancelled' do
      order.update!(status: 'pending')
      # Assuming order has items using the product.
      # Create an order item for the existing order and product
      OrderItem.create!(order: order, product: product, quantity: 5, price: 10)
      # Decrement manually to simulate initial purchase if not already done
      product.update!(stock: 95) 

      patch "/api/v1/orders/#{order.id}/update_status", params: { status: 'cancelled' }
      expect(response).to have_http_status(:ok)
      expect(product.reload.stock).to eq(100) # 95 + 5
    end
  end
  end
end

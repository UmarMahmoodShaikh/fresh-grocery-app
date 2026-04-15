require 'rails_helper'

RSpec.describe "Api::V2::Orders", type: :request do
  let!(:store) { Store.create!(name: "Market Store", slug: "market-store", active: true) }
  let!(:category) { Category.create!(name: "Dairy") }
  let!(:product) { Product.create!(name: "Milk", category: category, price: 2.0, stock: 10) }
  let!(:store_product) { StoreProduct.create!(store: store, product: product, price: 2.0, stock: 10) }
  let!(:user) { User.create!(email: "shopper@example.com", password: "password") }
  let(:idempotency_key) { SecureRandom.uuid }
  
  before do
    # Create address with ALL required fields
    Address.create!(
      user: user, 
      street: "123 Grocery Lane", 
      city: "Casablanca", 
      country: "Morocco", 
      zip_code: "20000",
      latitude: 33.5731,
      longitude: -7.5898,
      is_default: true
    )

    # Mock authentication to set @current_user and skip JWT decoding
    allow_any_instance_of(Api::V2::OrdersController).to receive(:authenticate_request).and_return(true)
    allow_any_instance_of(Api::V2::OrdersController).to receive(:current_user).and_return(user)
    
    # Put 3 milks in the Redis cart
    # Note: Use the same format as ManageService: cart:user:ID:slug
    cart_key = "cart:user:#{user.id}:#{store.slug}"
    $redis.hset(cart_key, product.id.to_s, "3")
  end

  describe "POST /api/v2/stores/:store_slug/orders/checkout" do
    let(:checkout_params) { { delivery_address: "123 Grocery Lane", total: 6.0 } }
    let(:headers) { { "X-Idempotency-Key" => idempotency_key } }

    it "creates an order and clears the Redis cart" do
      expect {
        post "/api/v2/stores/#{store.slug}/orders/checkout", params: checkout_params, headers: headers
      }.to change(Order, :count).by(1)

      expect(response).to have_http_status(:created)
      
      # Verify stock was decremented (Milk Race Check)
      expect(store_product.reload.stock).to eq(7)
      
      # Verify Redis cart is empty
      cart_key = "cart:user:#{user.id}:#{store.slug}"
      expect($redis.exists?(cart_key)).to be false
    end

    it "prevents duplicate orders (Idempotency Check)" do
      # First request
      post "/api/v2/stores/#{store.slug}/orders/checkout", params: checkout_params, headers: headers
      expect(response).to have_http_status(:created)
      order_id = JSON.parse(response.body)["order"]["id"]

      # Second request with EXACT SAME KEY
      expect {
        post "/api/v2/stores/#{store.slug}/orders/checkout", params: checkout_params, headers: headers
      }.not_to change(Order, :count)

      expect(response).to have_http_status(:ok) # Returns cached response
      expect(JSON.parse(response.body)["order"]["id"]).to eq(order_id)
    end

    it "fails if items are out of stock" do
      # Change stock to 1
      store_product.update!(stock: 1)

      post "/api/v2/stores/#{store.slug}/orders/checkout", params: checkout_params, headers: headers
      
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)["error"]).to include("is out of stock")
    end
  end
end

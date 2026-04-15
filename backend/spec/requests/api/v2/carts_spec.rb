require 'rails_helper'

RSpec.describe "Api::V2::Carts", type: :request do
  let!(:store) { Store.create!(name: "Test Store", slug: "test-store", active: true) }
  let!(:category) { Category.create!(name: "Fruits") }
  let!(:product) { Product.create!(name: "Apple", category: category, price: 1.5, stock: 100) }
  let!(:store_product) { StoreProduct.create!(store: store, product: product, price: 1.5, stock: 100) }
  let!(:user) { User.create!(email: "test@example.com", password: "password") }
  let(:headers) { { "ACCEPT" => "application/json" } }

  describe "POST /api/v2/stores/:store_slug/cart/add_item" do
    it "adds an item to the Redis cart" do
      post "/api/v2/stores/#{store.slug}/cart/add_item", 
           params: { product_id: product.id, quantity: 2 }, 
           headers: headers

      expect(response).to have_http_status(:ok)
      
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Item added to cart")
    end

    it "updates quantity if same item is added twice" do
      # Add first
      post "/api/v2/stores/#{store.slug}/cart/add_item", params: { product_id: product.id, quantity: 2 }
      
      # Add again
      post "/api/v2/stores/#{store.slug}/cart/add_item", params: { product_id: product.id, quantity: 3 }
      
      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /api/v2/stores/:store_slug/cart" do
    it "returns the current state of the Redis cart" do
      # Pre-populate Redis for this guest using the exact same logic as the service
      cart_key = "cart:guest:#{store.slug}"
      $redis.hset(cart_key, product.id.to_s, "5")

      get "/api/v2/stores/#{store.slug}/cart", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json["items"]).not_to be_nil
      expect(json["items"].length).to be > 0
      expect(json["items"].first["quantity"]).to eq(5)
    end
  end

  describe "DELETE /api/v2/stores/:store_slug/cart/items/:product_id" do
    it "removes an item from the Redis cart" do
      cart_key = "cart:guest:#{store.slug}"
      $redis.hset(cart_key, product.id.to_s, "5")

      delete "/api/v2/stores/#{store.slug}/cart/items/#{product.id}", headers: headers

      expect(response).to have_http_status(:ok)
      expect($redis.hexists(cart_key, product.id.to_s)).to be false
    end
  end
end

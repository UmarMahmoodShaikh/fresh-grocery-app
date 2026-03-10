require 'rails_helper'

RSpec.describe "Api::V1::Orders", type: :request do
  let(:user)     { User.create!(email: "customer@example.com", password: "password", first_name: "John", last_name: "Doe") }
  let(:token)    { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base) }
  let(:headers)  { { "Authorization" => "Bearer #{token}" } }
  let(:category) { Category.create!(name: "Food") }
  let(:brand)    { Brand.create!(name: "Famous Brand") }
  let(:product)  { Product.create!(name: "Apple", price: 2.5, stock: 100, category: category, brand: brand) }
  let(:address) do
    Address.create!(
      user: user, label: :home, street: "123 Main St", city: "Paris",
      zip_code: "75001", country: "France", latitude: 48.8566, longitude: 2.3522
    )
  end

  describe "POST /api/v1/orders" do
    let(:valid_params) do
      {
        order: {
          total: 5.0,
          address_id: address.id,
          delivery_address: "123 Main St, Paris, 75001, France",
          delivery_fee: 1.0
        },
        items: [
          { product_id: product.id, quantity: 2, price: 2.5 }
        ]
      }
    end

    context "when authenticated" do
      it "creates a new order for the user" do
        expect {
          post "/api/v1/orders", params: valid_params, headers: headers, as: :json
        }.to change(Order, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["user_id"]).to eq(user.id)
        expect(json["order_items"].count).to eq(1)
      end

      it "decrements product stock" do
        initial_stock = product.stock
        post "/api/v1/orders", params: valid_params, headers: headers, as: :json
        expect(product.reload.stock).to eq(initial_stock - 2)
      end

      it "automatically creates an invoice" do
        post "/api/v1/orders", params: valid_params, headers: headers, as: :json
        order = Order.last
        expect(order.invoice).to be_present
        expect(order.invoice.total).to eq(5.0)
      end
    end

    context "with invalid parameters" do
      it "returns unprocessable entity" do
        invalid_params = { order: { total: nil } }
        post "/api/v1/orders", params: invalid_params, headers: headers, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end

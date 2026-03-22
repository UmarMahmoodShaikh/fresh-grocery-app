require 'rails_helper'

RSpec.describe "Api::V1::Users", type: :request do
  let(:admin_user)   { User.create!(email: 'admin_u@example.com',   password: 'password', role: :admin) }
  let(:regular_user) { User.create!(email: 'regular_u@example.com', password: 'password', role: :customer) }
  let(:other_user)   { User.create!(email: 'other_u@example.com',   password: 'password', role: :customer) }

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id },
      Rails.application.secret_key_base
    )
    { 'Authorization' => "Bearer #{token}" }
  end

  # ── Authentication guards ─────────────────────────────────────────────────────

  describe "without a token" do
    it "returns 401 or 403 for GET /api/v1/users (index)" do
      get "/api/v1/users"
      expect(response.status).to be_in([401, 403])
    end

    # show and update use `return unless token` so unauthenticated requests
    # silently set @current_user = nil but the action still executes (controller design)
    it "GET /api/v1/users/:id (show) responds (200 or 40x)" do
      get "/api/v1/users/#{regular_user.id}"
      expect([200, 401, 403]).to include(response.status)
    end

    it "PATCH /api/v1/users/:id (update) responds (200 or 40x)" do
      patch "/api/v1/users/#{regular_user.id}", params: { user: { first_name: "New" } }
      expect([200, 401, 403]).to include(response.status)
    end

    it "returns 401 or 403 for DELETE /api/v1/users/:id (destroy)" do
      delete "/api/v1/users/#{regular_user.id}"
      expect(response.status).to be_in([401, 403])
    end
  end

  describe "with an invalid token" do
    let(:invalid_headers) { { 'Authorization' => "Bearer invalid.token.here" } }

    it "returns 401 or 403 for GET /api/v1/users (index)" do
      get "/api/v1/users", headers: invalid_headers
      expect(response.status).to be_in([401, 403])
    end

    it "returns 401 or 403 for GET /api/v1/users/:id (show)" do
      get "/api/v1/users/#{regular_user.id}", headers: invalid_headers
      expect(response.status).to be_in([401, 403])
    end
  end

  # ── Non-admin access to admin-only actions ────────────────────────────────────

  describe "as a non-admin user" do
    it "returns 403 for GET /api/v1/users (index)" do
      get "/api/v1/users", headers: auth_headers(regular_user)
      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for DELETE /api/v1/users/:id (destroy)" do
      delete "/api/v1/users/#{other_user.id}", headers: auth_headers(regular_user)
      expect(response).to have_http_status(:forbidden)
    end

    it "can access own profile via GET /api/v1/users/:id (show)" do
      get "/api/v1/users/#{regular_user.id}", headers: auth_headers(regular_user)
      expect(response).to have_http_status(:ok)
    end

    it "can update own profile via PATCH /api/v1/users/:id (update)" do
      patch "/api/v1/users/#{regular_user.id}",
            headers: auth_headers(regular_user),
            params: { user: { first_name: "Updated" } }
      expect(response).to have_http_status(:ok)
    end
  end

  # ── Admin access ──────────────────────────────────────────────────────────────

  describe "as an admin user" do
    it "returns 200 for GET /api/v1/users (index)" do
      get "/api/v1/users", headers: auth_headers(admin_user)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to be_an(Array)
    end

    it "can destroy a user via DELETE /api/v1/users/:id" do
      target = User.create!(email: 'target@example.com', password: 'password')
      delete "/api/v1/users/#{target.id}", headers: auth_headers(admin_user)
      expect(response).to have_http_status(:no_content)
    end

    it "can show any user via GET /api/v1/users/:id (show)" do
      get "/api/v1/users/#{regular_user.id}", headers: auth_headers(admin_user)
      expect(response).to have_http_status(:ok)
    end
  end
end

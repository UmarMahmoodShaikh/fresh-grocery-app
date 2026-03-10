require 'rails_helper'

RSpec.describe 'Auth API', type: :request do
  let!(:user) { User.create!(email: 'login@example.com', password: 'secret123', role: :customer) }

  def encode_token(user)
    JWT.encode({ user_id: user.id }, Rails.application.secret_key_base)
  end

  # ── Login ─────────────────────────────────────────────────────────────────────

  describe 'POST /api/v1/auth/login' do
    it 'returns a JWT token for valid credentials' do
      post '/api/v1/auth/login', params: { email: user.email, password: 'secret123' }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['token']).to be_present
      expect(json['user']['email']).to eq(user.email)
    end

    it 'rejects invalid credentials' do
      post '/api/v1/auth/login', params: { email: user.email, password: 'wrong' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'rejects unknown email' do
      post '/api/v1/auth/login', params: { email: 'nobody@example.com', password: 'secret123' }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # ── Signup ────────────────────────────────────────────────────────────────────

  describe 'POST /api/v1/auth/signup' do
    let(:new_user_params) do
      {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '+33612345678'
      }
    end

    it 'creates a new customer and returns a token' do
      expect {
        post '/api/v1/auth/signup', params: new_user_params
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['token']).to be_present
      expect(json['user']['email']).to eq('new@example.com')
      expect(json['user']['role']).to eq('customer')
    end

    it 'returns 422 when email is already taken' do
      post '/api/v1/auth/signup', params: new_user_params.merge(email: user.email)
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['errors']).to be_present
    end

    it 'returns 422 when password is missing' do
      post '/api/v1/auth/signup', params: new_user_params.merge(password: nil)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  # ── Me ────────────────────────────────────────────────────────────────────────

  describe 'GET /api/v1/auth/me' do
    it 'returns current user when token is valid' do
      get '/api/v1/auth/me',
          headers: { 'Authorization' => "Bearer #{encode_token(user)}" }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['email']).to eq(user.email)
      expect(json['id']).to eq(user.id)
    end

    it 'returns 401 when no token is provided' do
      get '/api/v1/auth/me'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 401 with an invalid token' do
      get '/api/v1/auth/me', headers: { 'Authorization' => 'Bearer invalid.token' }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # ── Check Email ───────────────────────────────────────────────────────────────

  describe 'POST /api/v1/auth/check-email' do
    it 'returns exists: true and role for a known email' do
      post '/api/v1/auth/check-email', params: { email: user.email }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['exists']).to be true
      expect(json['role']).to eq('customer')
    end

    it 'returns exists: false for an unknown email' do
      post '/api/v1/auth/check-email', params: { email: 'nobody@example.com' }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['exists']).to be false
    end
  end
end

require 'rails_helper'

RSpec.describe 'Auth API', type: :request do
  let!(:user) { User.create!(email: 'login@example.com', password: 'secret', role: :customer) }

  describe 'POST /api/v1/auth/login' do
    it 'returns a JWT token for valid credentials' do
      post '/api/v1/auth/login', params: { email: user.email, password: 'secret' }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['token']).to be_present
    end

    it 'rejects invalid credentials' do
      post '/api/v1/auth/login', params: { email: user.email, password: 'wrong' }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

require 'rails_helper'

RSpec.describe 'Reports API', type: :request do
  let!(:admin) { User.create!(email: 'admin2@example.com', password: 'password', role: :admin) }

  describe 'GET /api/v1/reports' do
    before do
      allow_any_instance_of(Api::V1::ReportsController).to receive(:authenticate_admin!).and_return(true)
    end

    it 'returns a JSON payload' do
      get '/api/v1/reports'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to be_a(Hash)
    end
  end
end

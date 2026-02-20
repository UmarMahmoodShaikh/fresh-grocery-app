require 'rails_helper'

RSpec.describe 'Invoices API', type: :request do
  let!(:admin)    { User.create!(email: 'admin2@example.com', password: 'password', role: :admin) }
  let!(:customer) { User.create!(email: 'cust@example.com', password: 'password', role: :customer) }

  let!(:order) do
    Order.create!(
      user: customer,
      total: 50.0,
      status: :pending,
      delivery_address: '123 Test St',
      delivery_fee: 0.0
    )
  end

  let!(:invoice) { Invoice.create!(order: order, total: 50.0, status: :unpaid) }

  describe 'GET /api/v1/invoices' do
    context 'as admin' do
      before { allow_any_instance_of(Api::V1::InvoicesController)
               .to receive(:current_user).and_return(admin) }

      it 'returns all invoices' do
        get '/api/v1/invoices'
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json).to be_an(Array)
        expect(json.map { |i| i['id'] }).to include(invoice.id)
      end
    end

    context 'as regular user' do
      before { allow_any_instance_of(Api::V1::InvoicesController)
               .to receive(:current_user).and_return(customer) }

      it 'returns only own invoices' do
        get '/api/v1/invoices'
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json.map { |i| i['order_id'] }).to include(order.id)
      end
    end

    context 'without authentication' do
      it 'returns unauthorized' do
        get '/api/v1/invoices'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /api/v1/invoices/:id' do
    before { allow_any_instance_of(Api::V1::InvoicesController)
             .to receive(:current_user).and_return(admin) }

    it 'returns the invoice' do
      get "/api/v1/invoices/#{invoice.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(invoice.id)
      expect(json['status']).to eq('unpaid')
    end
  end
end

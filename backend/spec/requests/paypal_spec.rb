require 'rails_helper'

RSpec.describe 'PayPal API', type: :request do
  let!(:user) do
    User.create!(
      email: 'paypaltest@example.com',
      password: 'Password123!',
      first_name: 'Test',
      last_name: 'User',
      phone: '+33612345678',
      role: :customer
    )
  end

  let!(:address) do
    Address.create!(
      user: user,
      label: :home,
      street: '10 Rue de Rivoli',
      city: 'Paris',
      zip_code: '75001',
      country: 'France',
      latitude: 48.8566,
      longitude: 2.3522,
      is_default: true,
      is_active: true
    )
  end

  let!(:product) do
    Product.first || Product.create!(
      name: 'Test Product',
      price: 29.99,
      stock: 100
    )
  end

  let!(:order) do
    Order.create!(
      user: user,
      address: address,
      total: 29.99,
      status: :pending,
      delivery_fee: 0
    )
  end

  def auth_headers
    token = JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, Rails.application.secret_key_base)
    { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' }
  end

  # ── Fake HTTParty response helper ──────────────────────────────────────────

  def stubbed_httparty_response(body:, code: 200)
    double = instance_double(HTTParty::Response)
    allow(double).to receive(:success?).and_return(code.between?(200, 299))
    allow(double).to receive(:code).and_return(code)
    allow(double).to receive(:parsed_response).and_return(body)
    double
  end

  # ── POST /api/v1/paypal/create-order ─────────────────────────────────────

  describe 'POST /api/v1/paypal/create-order' do
    context 'when PayPal credentials are missing' do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('PAYPAL_CLIENT_ID').and_return(nil)
        allow(ENV).to receive(:[]).with('PAYPAL_CLIENT_SECRET').and_return(nil)
      end

      it 'returns 503 service unavailable' do
        post '/api/v1/paypal/create-order',
             params: { order_id: order.id }.to_json,
             headers: auth_headers
        expect(response).to have_http_status(:service_unavailable)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('Payment service unavailable')
      end
    end

    context 'when PayPal credentials are present' do
      let(:fake_token_response) do
        stubbed_httparty_response(body: { 'access_token' => 'FAKE_ACCESS_TOKEN_123' })
      end

      let(:fake_order_response) do
        stubbed_httparty_response(body: {
          'id'     => 'PAYPAL-ORDER-ABC123',
          'status' => 'CREATED',
          'links'  => [
            { 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-ABC123', 'rel' => 'approve', 'method' => 'GET' },
            { 'href' => 'https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-ABC123', 'rel' => 'self',    'method' => 'GET' }
          ]
        })
      end

      before do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('PAYPAL_CLIENT_ID').and_return('FAKE_CLIENT_ID')
        allow(ENV).to receive(:[]).with('PAYPAL_CLIENT_SECRET').and_return('FAKE_CLIENT_SECRET')
        allow(ENV).to receive(:[]).with('PAYPAL_MODE').and_return('sandbox')

        # Stub the OAuth token call
        allow(HTTParty).to receive(:post)
          .with(a_string_matching(/oauth2\/token/), anything)
          .and_return(fake_token_response)

        # Stub the PayPal create-order call
        allow(HTTParty).to receive(:post)
          .with(a_string_matching(/v2\/checkout\/orders$/), anything)
          .and_return(fake_order_response)
      end

      it 'returns 200 with PayPal order ID and links' do
        post '/api/v1/paypal/create-order',
             params: { order_id: order.id }.to_json,
             headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['id']).to eq('PAYPAL-ORDER-ABC123')
        expect(json['status']).to eq('CREATED')
        expect(json['links']).to be_present
        approve_link = json['links'].find { |l| l['rel'] == 'approve' }
        expect(approve_link).to be_present
        expect(approve_link['href']).to include('paypal.com')
      end

      it 'returns 404 when order does not belong to the user' do
        other_user = User.create!(email: 'other@example.com', password: 'Password123!', phone: '+33699887766')
        other_order = Order.create!(user: other_user, address: address, total: 10.0, status: :pending, delivery_fee: 0)

        post '/api/v1/paypal/create-order',
             params: { order_id: other_order.id }.to_json,
             headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        post '/api/v1/paypal/create-order', params: { order_id: order.id }.to_json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  # ── POST /api/v1/paypal/capture-order ────────────────────────────────────

  describe 'POST /api/v1/paypal/capture-order' do
    let(:fake_token_response) do
      stubbed_httparty_response(body: { 'access_token' => 'FAKE_ACCESS_TOKEN_123' })
    end

    let(:fake_capture_response) do
      stubbed_httparty_response(body: {
        'id'             => 'PAYPAL-ORDER-ABC123',
        'status'         => 'COMPLETED',
        'payer'          => { 'email_address' => 'buyer@example.com' },
        'purchase_units' => [{ 'reference_id' => order.id.to_s }]
      })
    end

    before do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('PAYPAL_CLIENT_ID').and_return('FAKE_CLIENT_ID')
      allow(ENV).to receive(:[]).with('PAYPAL_CLIENT_SECRET').and_return('FAKE_CLIENT_SECRET')
      allow(ENV).to receive(:[]).with('PAYPAL_MODE').and_return('sandbox')

      allow(HTTParty).to receive(:post)
        .with(a_string_matching(/oauth2\/token/), anything)
        .and_return(fake_token_response)

      allow(HTTParty).to receive(:post)
        .with(a_string_matching(/PAYPAL-ORDER-ABC123\/capture/), anything)
        .and_return(fake_capture_response)
    end

    it 'captures payment and returns COMPLETED status' do
      post '/api/v1/paypal/capture-order',
           params: { orderID: 'PAYPAL-ORDER-ABC123', order_id: order.id }.to_json,
           headers: auth_headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['status']).to eq('COMPLETED')
      expect(json['payer']['email_address']).to eq('buyer@example.com')
    end

    it 'marks the internal order as processing after capture' do
      post '/api/v1/paypal/capture-order',
           params: { orderID: 'PAYPAL-ORDER-ABC123', order_id: order.id }.to_json,
           headers: auth_headers
      expect(order.reload.status).to eq('processing')
    end

    it 'rejects invalid PayPal order ID format' do
      post '/api/v1/paypal/capture-order',
           params: { orderID: 'invalid order! id', order_id: order.id }.to_json,
           headers: auth_headers
      expect(response).to have_http_status(:bad_request)
    end

    context 'without authentication' do
      it 'returns 401 unauthorized' do
        post '/api/v1/paypal/capture-order',
             params: { orderID: 'PAYPAL-ORDER-ABC123', order_id: order.id }.to_json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

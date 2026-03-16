module Api
  module V1
    class PaypalController < ApplicationController
      include Authenticatable

      skip_before_action :verify_authenticity_token

      # ── Auth gate: ALL PayPal endpoints require a valid JWT ──────────────────
      before_action :authenticate_user!

      PAYPAL_MODE = ENV.fetch("PAYPAL_MODE", "sandbox").freeze
      PAYPAL_BASE_URL = (PAYPAL_MODE == "live" \
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com").freeze

      # PAYPAL_ORDER_ID_REGEX: only characters PayPal itself uses in order IDs
      PAYPAL_ORDER_ID_REGEX = /\A[A-Z0-9\-]+\z/

      # ──────────────────────────────────────────────────────────────────────────
      # POST /api/v1/paypal/create-order
      #
      # Requires:  Authorization: Bearer <jwt>
      # Body:      { order_id: <internal DB order id> }
      #
      # We look up the Order in our DB so the client cannot spoof the amount.
      # ──────────────────────────────────────────────────────────────────────────
      def create_order
        order_id = params[:order_id].to_i
        order    = current_user.orders.find_by(id: order_id)

        unless order
          return render json: { error: "Order not found or does not belong to you" },
                        status: :not_found
        end

        # Amount & currency come from the server — never from the client
        amount   = order.total.to_f
        currency = "EUR"

        if amount <= 0
          return render json: { error: "Invalid order amount" }, status: :unprocessable_entity
        end

        token = access_token
        return render json: { error: "Payment service unavailable" }, status: :service_unavailable unless token

        response = HTTParty.post(
          "#{PAYPAL_BASE_URL}/v2/checkout/orders",
          headers: {
            "Content-Type"  => "application/json",
            "Authorization" => "Bearer #{token}"
          },
          body: build_order_body(amount, currency, order).to_json
        )

        if response.success?
          result = response.parsed_response
          Rails.logger.info "[PayPal] Order created: #{result['id']} | user=#{current_user.id} | amount=#{amount} #{currency}"
          render json: { id: result["id"], status: result["status"], links: result["links"] }
        else
          Rails.logger.error "[PayPal] create-order failed: #{response.code} | user=#{current_user.id}"
          render json: { error: "Failed to create PayPal order" }, status: :unprocessable_entity
        end

      rescue => e
        Rails.logger.error "[PayPal] create-order exception: #{e.message} | user=#{current_user.id}"
        render json: { error: "Payment processing error" }, status: :internal_server_error
      end

      # ──────────────────────────────────────────────────────────────────────────
      # POST /api/v1/paypal/capture-order
      #
      # Requires:  Authorization: Bearer <jwt>
      # Body:      { orderID: <paypal_order_id>, order_id: <internal DB order id> }
      #
      # Validates that:
      #   - The PayPal order ID matches the expected regex (no injection)
      #   - The internal order belongs to the authenticated user
      # ──────────────────────────────────────────────────────────────────────────
      def capture_order
        paypal_order_id = params[:orderID].to_s.strip
        order_id        = params[:order_id].to_i

        # Validate PayPal order ID format to prevent path injection
        unless paypal_order_id.match?(PAYPAL_ORDER_ID_REGEX)
          return render json: { error: "Invalid PayPal order ID format" }, status: :bad_request
        end

        # Confirm this internal order belongs to the current user
        order = current_user.orders.find_by(id: order_id)
        unless order
          return render json: { error: "Order not found or does not belong to you" },
                        status: :not_found
        end

        token = access_token
        return render json: { error: "Payment service unavailable" }, status: :service_unavailable unless token

        response = HTTParty.post(
          "#{PAYPAL_BASE_URL}/v2/checkout/orders/#{paypal_order_id}/capture",
          headers: {
            "Content-Type"  => "application/json",
            "Authorization" => "Bearer #{token}"
          },
          body: "{}"
        )

        if response.success?
          result = response.parsed_response
          Rails.logger.info "[PayPal] Payment captured: #{result['id']} | status=#{result['status']} | user=#{current_user.id} | order=#{order_id}"

          # Mark the internal order as paid
          order.update(status: "processing") if order.status == "pending"

          render json: {
            id:             result["id"],
            status:         result["status"],
            payer:          result["payer"],
            purchase_units: result["purchase_units"]
          }
        else
          Rails.logger.error "[PayPal] capture-order failed: #{response.code} | paypal_order=#{paypal_order_id} | user=#{current_user.id}"
          render json: { error: "Failed to capture PayPal order" }, status: :unprocessable_entity
        end

      rescue => e
        Rails.logger.error "[PayPal] capture-order exception: #{e.message} | user=#{current_user.id}"
        render json: { error: "Payment processing error" }, status: :internal_server_error
      end

      private

      # ── PayPal OAuth2 client credentials token ────────────────────────────────
      def access_token
        client_id     = ENV["PAYPAL_CLIENT_ID"]
        client_secret = ENV["PAYPAL_CLIENT_SECRET"]
        return nil if client_id.blank? || client_secret.blank?

        response = HTTParty.post(
          "#{PAYPAL_BASE_URL}/v1/oauth2/token",
          basic_auth: { username: client_id, password: client_secret },
          headers:    { "Content-Type" => "application/x-www-form-urlencoded" },
          body:       "grant_type=client_credentials"
        )

        response.success? ? response.parsed_response["access_token"] : nil

      rescue => e
        Rails.logger.error "[PayPal] access_token exception: #{e.message}"
        nil
      end

      # ── Build PayPal order body from internal order ───────────────────────────
      def build_order_body(amount, currency, order)
        {
          intent: "CAPTURE",
          purchase_units: [{
            reference_id: order.id.to_s,
            description:  "Fresh Grocery Order ##{order.id}",
            amount: {
              currency_code: currency,
              value:         format("%.2f", amount)
            }
          }],
          application_context: {
            brand_name:   "Fresh Grocery Store",
            landing_page: "BILLING",
            user_action:  "PAY_NOW",
            return_url:   "https://fresh-grocery-store.herokuapp.com/paypal/success",
            cancel_url:   "https://fresh-grocery-store.herokuapp.com/paypal/cancel"
          }
        }
      end
    end
  end
end

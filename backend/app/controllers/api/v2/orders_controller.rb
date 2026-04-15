module Api
  module V2
    class OrdersController < ApplicationController
      before_action :authenticate_request # Adjust to your app's auth
      before_action :set_store

      # POST /api/v2/stores/:store_slug/orders/checkout
      def checkout
        idempotency_key = request.headers['X-Idempotency-Key']

        # 1. Check if order already exists with this key (Idempotency check)
        if idempotency_key.present?
          # We check the database to see if we've already processed this specific request key
          existing_order = current_user.orders.find_by(idempotency_key: idempotency_key) if current_user
          
          if existing_order
            return render json: { 
              order: existing_order, 
              message: "Order already processed (Idempotent response)",
              idempotent: true 
            }, status: :ok
          end
        end

        # 2. Trigger the Checkout Service
        # The service will automatically pull the cart items from Redis
        result = Orders::CheckoutService.call(
          user: current_user, # Can be nil for Guest Checkout if supported
          store: @store,
          delivery_address: params[:delivery_address],
          idempotency_key: idempotency_key
        )

        if result.success?
          render json: { order: result.payload[:order], message: "Order placed successfully!" }, status: :created
        else
          render json: { error: result.error }, status: result.status
        end
      end

      def index
        orders = current_user.orders.where(store: @store).includes(order_items: :product)
        render json: orders, status: :ok
      end

      def show
        order = current_user.orders.find_by!(store: @store, id: params[:id])
        render json: order.as_json(include: { order_items: { include: :product } }), status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Order not found" }, status: :not_found
      end

      private

      def set_store
        @store = Store.find_by!(slug: params[:store_slug], active: true)
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Store not found' }, status: :not_found
      end
    end
  end
end

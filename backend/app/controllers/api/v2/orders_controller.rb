module Api
  module V2
    class OrdersController < ApplicationController
      before_action :authenticate_request # Adjust to your app's auth
      before_action :set_store

      def create
        idempotency_key = request.headers['X-Idempotency-Key']

        # 1. Check if order already exists with this key (Idempotency check)
        if idempotency_key.present?
          existing_order = current_user.orders.find_by(idempotency_key: idempotency_key)
          if existing_order
            return render json: { 
              order: existing_order, 
              message: "Order already processed (Idempotent response)",
              idempotent: true 
            }, status: :ok
          end
        end

        cart = Cart.find_by(user: current_user, store: @store)
        
        unless cart
          return render json: { error: "No active cart found for this store" }, status: :bad_request
        end

        result = Orders::CheckoutService.call(
          user: current_user,
          store: @store,
          cart: cart,
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

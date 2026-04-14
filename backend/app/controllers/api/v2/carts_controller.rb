module Api
  module V2
    class CartsController < ApplicationController
      before_action :authenticate_request
      before_action :set_store
      before_action :set_cart_service

      def show
        result = @cart_service.view
        render json: { 
          total_items: result.payload[:total_items],
          items: result.payload[:items],
          warnings: result.payload[:warnings]
        }, status: :ok
      end

      def update
        # Expects { product_id: 1, quantity: 2 }
        result = @cart_service.add_item(
          product_id: params[:product_id], 
          quantity: params[:quantity].to_i
        )

        if result.success?
          render json: { message: "Item added to cart" }, status: :ok
        else
          render json: { error: result.error }, status: result.status
        end
      end

      def destroy
        if params[:product_id].present?
          # Remove specific item
          result = @cart_service.remove_item(product_id: params[:product_id])
        else
          # Clear entire cart
          result = @cart_service.clear
        end

        if result.success?
          render json: { message: result.payload[:message] }, status: :ok
        else
          render json: { error: result.error }, status: result.status
        end
      end

      private

      def set_store
        @store = Store.find_by!(slug: params[:store_slug], active: true)
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Store not found' }, status: :not_found
      end

      def set_cart_service
        @cart_service = Carts::ManageService.new(user: current_user, store: @store)
      end
    end
  end
end

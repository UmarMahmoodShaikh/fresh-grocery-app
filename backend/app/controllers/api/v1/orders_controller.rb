module Api
  module V1
    class OrdersController < ApplicationController
      skip_before_action :verify_authenticity_token
      # Hard authentication required for protected actions
      before_action :authenticate_user!, except: [:create, :show]
      # Soft authentication for create: associates order with user if token present,
      # falls back to guest checkout if no/invalid token
      before_action :try_authenticate_user!, only: [:create]
      before_action :set_order, only: [:show, :update_status, :destroy]

      # GET /api/v1/orders
      def index
        if current_user&.admin?
          @orders = Order.includes(:order_items, :user).all
        elsif current_user
          @orders = current_user.orders.includes(:order_items)
        else
          render json: { message: 'Unauthorized' }, status: :unauthorized
          return
        end
        
        render json: @orders.as_json(include: :order_items)
      end

      # GET /api/v1/orders/:id
      def show
        render json: @order.as_json(include: :order_items)
      end

      # POST /api/v1/orders
      def create
        if current_user
          @order = Order.new(order_params)
          @order.user = current_user
        else
          # Guest Checkout: Create a guest user
          user_params = params[:guest_info] || {}
          guest_email = user_params[:email] || "guest_#{SecureRandom.hex(4)}@example.com"
          @guest_user = User.find_or_initialize_by(email: guest_email)
          @guest_user.password ||= SecureRandom.hex(8)
          @guest_user.role = :guest
          @guest_user.first_name = user_params[:first_name]
          @guest_user.last_name = user_params[:last_name]
          @guest_user.phone = user_params[:phone]
          @guest_user.save! if @guest_user.new_record?
          
          @order = Order.new(order_params)
          @order.user = @guest_user
        end

        if @order.save
          # Create order items and decrement stock
          if params[:items].present?
            params[:items].each do |item|
              @order.order_items.create!(
                product_id: item[:product_id],
                quantity: item[:quantity],
                price: item[:price]
              )
              # Decrement stock
              product = Product.find(item[:product_id])
              qty = item[:quantity].to_i
              product.update(stock: product.stock - qty) if product.stock.present?
            end
          end

          # Auto-generate Invoice
          @order.create_invoice!(
            total: @order.total,
            status: :unpaid
          )
          
          render json: @order.as_json(include: [:order_items, :invoice]), status: :created
        else
          render json: { errors: @order.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/orders/:id/update_status
      def update_status
        unless current_user&.admin?
          render json: { message: 'Unauthorized' }, status: :forbidden
          return
        end

        old_status = @order.status
        if @order.update(status: params[:status])
          if params[:status] == 'cancelled' && old_status != 'cancelled'
            @order.order_items.each do |item|
              product = item.product
              product.update(stock: product.stock + item.quantity) if product.stock.present?
            end
          end
          render json: @order
        else
          render json: { errors: @order.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/orders/:id
      def destroy
        @order.destroy
        head :no_content
      end

      private

      def set_order
        @order = Order.find(params[:id])
      end

      def order_params
        params.require(:order).permit(:user_id, :total, :status, :delivery_address, :delivery_fee, :score, :comments)
      end

      # Called for ALL actions — sets @current_user if token is valid, silently ignores otherwise
      def try_authenticate_user!
        token = request.headers['Authorization']&.split(' ')&.last
        return unless token

        begin
          decoded = JWT.decode(token, Rails.application.secret_key_base)[0]
          @current_user = User.find(decoded['user_id'])
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound
          nil
        end
      end

      # Called for protected actions — sets @current_user or returns 401
      def authenticate_user!
        token = request.headers['Authorization']&.split(' ')&.last
        unless token
          render json: { message: 'Unauthorized' }, status: :unauthorized
          return
        end

        begin
          decoded = JWT.decode(token, Rails.application.secret_key_base)[0]
          @current_user = User.find(decoded['user_id'])
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound
          render json: { message: 'Unauthorized' }, status: :unauthorized
        end
      end

      def current_user
        @current_user
      end
    end
  end
end

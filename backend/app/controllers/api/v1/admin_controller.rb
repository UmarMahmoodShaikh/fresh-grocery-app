module Api
  module V1
    class AdminController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_user!
      before_action :require_admin!

      # GET /api/v1/admin/dashboard/summary
      def summary
        total_orders = Order.count
        total_users = User.count
        total_products = Product.count

        render json: {
          totalOrders: total_orders,
          totalInvoices: total_orders, # Same as orders in Rails
          totalUsersWithOrders: User.joins(:orders).distinct.count,
          totalProducts: total_products,
          totalUsers: total_users
        }
      end

      # GET /api/v1/admin/dashboard/orders
      def orders
        recent_orders = Order.includes(:user, :order_items)
                             .order(created_at: :desc)
                             .limit(10)
                             .map do |order|
          {
            id: order.id,
            orderId: order.id,
            userName: order.user&.email || 'Guest',
            userEmail: order.user&.email || '-',
            totalAmount: order.total,
            status: order.status,
            paymentStatus: 'completed', # Add payment_status field if needed
            orderDate: order.created_at,
            createdAt: order.created_at
          }
        end

        render json: recent_orders
      end

      private

      def authenticate_user!
        token = request.headers['Authorization']&.split(' ')&.last
        return render json: { message: 'Unauthorized' }, status: :unauthorized unless token

        begin
          decoded = JWT.decode(token, Rails.application.credentials.secret_key_base)[0]
          @current_user = User.find(decoded['user_id'])
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound
          render json: { message: 'Unauthorized' }, status: :unauthorized
        end
      end

      def require_admin!
        unless @current_user&.admin?
          render json: { message: 'Forbidden' }, status: :forbidden
        end
      end

      def current_user
        @current_user
      end
    end
  end
end

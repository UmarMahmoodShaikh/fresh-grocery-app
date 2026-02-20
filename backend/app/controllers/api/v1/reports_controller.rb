module Api
  module V1
    class ReportsController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_admin!

      def index
        reports = {
          kpi1_total_revenue: Order.where(status: :delivered).sum(:total),
          kpi2_average_order_value: Order.average(:total).to_f.round(2),
          kpi3_total_orders: Order.count,
          kpi4_most_purchased_products: OrderItem.joins(:product)
                                                .group('products.name')
                                                .order('count_all DESC')
                                                .limit(5)
                                                .count,
          kpi5_new_customers_30d: User.where('created_at > ?', 30.days.ago).count,
          sales_by_day: Order.group_by_day(:created_at).sum(:total) # Requires groupdate gem, fallback if not
        } rescue {
          kpi1_total_revenue: Order.sum(:total),
          kpi2_average_order_value: Order.average(:total).to_f.round(2),
          kpi3_total_orders: Order.count,
          kpi4_most_purchased_products: OrderItem.group(:product_id).count.sort_by{|_,v| -v}.first(5),
          kpi5_new_customers_30d: User.where('created_at > ?', 30.days.ago).count
        }

        render json: reports
      end

      private

      def authenticate_admin!
        token = request.headers['Authorization']&.split(' ')&.last
        return render json: { error: 'No token' }, status: :unauthorized unless token

        begin
          decoded = JWT.decode(token, Rails.application.credentials.secret_key_base)[0]
          @current_user = User.find(decoded['user_id'])
          render json: { error: 'Not Admin' }, status: :forbidden unless @current_user.admin?
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound
          render json: { error: 'Invalid token' }, status: :unauthorized
        end
      end
    end
  end
end

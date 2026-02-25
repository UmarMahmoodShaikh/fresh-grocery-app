module Api
  module V1
    class InvoicesController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_user!
      before_action :set_invoice, only: [:show, :update, :destroy]

      def index
        unless current_user
          render json: { error: 'Not Authorized' }, status: :unauthorized and return
        end
        
        @invoices = if current_user.admin?
                      Invoice.all
                    else
                      Invoice.joins(:order).where(orders: { user_id: current_user.id })
                    end

        if params[:order_id].present? && current_user.admin?
          @invoices = @invoices.where(order_id: params[:order_id])
        end

        limit = params[:limit] ? params[:limit].to_i : 10
        offset = params[:offset] ? params[:offset].to_i : 0

        paginated_invoices = @invoices.order(created_at: :desc).limit(limit).offset(offset)
        
        render json: paginated_invoices
      end

      def show
        render json: @invoice
      end

      def create
        @invoice = Invoice.new(invoice_params)
        if @invoice.save
          render json: @invoice, status: :created
        else
          render json: @invoice.errors, status: :unprocessable_entity
        end
      end

      def update
        if @invoice.update(invoice_params)
          render json: @invoice
        else
          render json: @invoice.errors, status: :unprocessable_entity
        end
      end

      def destroy
        @invoice.destroy
      end

      private

      def set_invoice
        @invoice = Invoice.find(params[:id])
      end

      def invoice_params
        params.require(:invoice).permit(:order_id, :total, :status)
      end

      def authenticate_user!
        token = request.headers['Authorization']&.split(' ')&.last
        return unless token

        begin
          decoded = JWT.decode(token, Rails.application.credentials.secret_key_base)[0]
          @current_user = User.find(decoded['user_id'])
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound
          nil
        end
        render json: { error: 'Not Authorized' }, status: :unauthorized unless @current_user
      end

      def current_user
        @current_user
      end
    end
  end
end

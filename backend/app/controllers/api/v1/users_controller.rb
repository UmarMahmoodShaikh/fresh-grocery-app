module Api
  module V1
    class UsersController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_user!
      before_action :require_admin!, except: [:show, :update]
      before_action :set_user, only: [:show, :update, :destroy]

      # GET /api/v1/users
      def index
        @users = User.all
        render json: @users.as_json(only: [:id, :email, :role, :first_name, :last_name, :phone, :created_at])
      end

      # GET /api/v1/users/:id
      def show
        render json: @user.as_json(only: [:id, :email, :role, :first_name, :last_name, :phone, :created_at], methods: [:formatted_phone])
      end

      # PATCH/PUT /api/v1/users/:id
      def update
        if @user.update(user_params)
          render json: @user.as_json(only: [:id, :email, :role, :first_name, :last_name, :phone], methods: [:formatted_phone])
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/users/:id
      def destroy
        @user.destroy
        head :no_content
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:email, :role, :password, :password_confirmation, :first_name, :last_name, :phone, :address, :zip_code, :city, :country)
      end

      def authenticate_user!
        token = request.headers['Authorization']&.split(' ')&.last
        return unless token

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

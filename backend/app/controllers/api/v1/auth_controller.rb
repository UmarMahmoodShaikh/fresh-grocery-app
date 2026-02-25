module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :verify_authenticity_token
      
      def login
        user = User.find_by(email: params[:email])
        
        if user&.valid_password?(params[:password])
          token = encode_token(user_id: user.id)
          render json: {
            message: 'Login successful',
            token: token,
            user: user_json(user)
          }, status: :ok
        else
          render json: { message: 'Invalid credentials' }, status: :unauthorized
        end
      end

      def signup
        user = User.new(
          email: params[:email],
          password: params[:password],
          first_name: params[:first_name],
          last_name: params[:last_name],
          phone: params[:phone],
          role: :customer
        )
        
        if user.save
          token = encode_token(user_id: user.id)
          render json: {
            message: 'User created successfully',
            token: token,
            user: user_json(user)
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def me
        if current_user
          render json: user_json(current_user), status: :ok
        else
          render json: { message: 'Unauthorized' }, status: :unauthorized
        end
      end

      def check_email
        user = User.find_by(email: params[:email])
        if user
          render json: {
            exists: true,
            role: user.role
          }
        else
          render json: {
            exists: false
          }
        end
      end

      private

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          formatted_phone: user.formatted_phone,
          address: user.address,
          zip_code: user.zip_code,
          city: user.city,
          country: user.country,
          created_at: user.created_at
        }
      end

      def encode_token(payload)
        JWT.encode(payload, Rails.application.secret_key_base)
      end
    end
  end
end

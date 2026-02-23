module Api
  module V1
    class AddressesController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_user!
      before_action :set_address, only: [:show, :update, :destroy, :set_default]

      # GET /api/v1/addresses
      def index
        cache_key = "user_#{current_user.id}_addresses"
        @addresses = Rails.cache.fetch(cache_key, expires_in: 30.minutes) do
          current_user.addresses.order(is_default: :desc, created_at: :desc).as_json(methods: [:label])
        end
        render json: @addresses
      end

      # GET /api/v1/addresses/:id
      def show
        cache_key = "user_#{current_user.id}_address_#{params[:id]}"
        address_json = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
          @address.as_json
        end
        render json: address_json
      end

      # POST /api/v1/addresses
      def create
        @address = current_user.addresses.build(address_params)

        # If this is the first address, make it default
        @address.is_default = true if current_user.addresses.count == 0

        if @address.save
          render json: @address, status: :created
        else
          render json: { errors: @address.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/addresses/:id
      def update
        if @address.update(address_params)
          render json: @address
        else
          render json: { errors: @address.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/addresses/:id
      def destroy
        was_default = @address.is_default
        @address.destroy

        # If deleted address was default, make the most recent one default
        if was_default
          new_default = current_user.addresses.order(created_at: :desc).first
          new_default&.update(is_default: true)
        end

        head :no_content
      end

      # PATCH /api/v1/addresses/:id/set_default
      def set_default
        # Unset all defaults first
        current_user.addresses.update_all(is_default: false)
        @address.update(is_default: true)

        render json: current_user.addresses.order(is_default: :desc, created_at: :desc)
      end

      private

      def set_address
        @address = current_user.addresses.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Address not found" }, status: :not_found
      end

      def address_params
        params.require(:address).permit(:label, :street, :city, :zip_code, :country, :latitude, :longitude, :is_default)
      end


      def authenticate_user!
        token = request.headers['Authorization']&.split(' ')&.last
        
        unless token.present?
          return render json: { error: 'Not Authorized' }, status: :unauthorized
        end

        begin
          decoded = JWT.decode(token, Rails.application.secret_key_base)[0]
          @current_user = User.find(decoded['user_id'])
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound
          render json: { error: 'Not Authorized' }, status: :unauthorized
        end
      end

      def current_user
        @current_user
      end
    end
  end
end

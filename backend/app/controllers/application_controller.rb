class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session

  def current_user
    @current_user
  end

  protected

  def authenticate_request
    token = request.headers['Authorization']&.split(' ')&.last
    unless token
      render json: { error: 'Not Authorized' }, status: :unauthorized
      return
    end

    begin
      decoded = JWT.decode(token, Rails.application.secret_key_base)[0]
      @current_user = User.find(decoded['user_id'])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render json: { error: 'Not Authorized' }, status: :unauthorized
    end
  end

  def try_authenticate_user
    token = request.headers['Authorization']&.split(' ')&.last
    return unless token

    begin
      decoded = JWT.decode(token, Rails.application.secret_key_base)[0]
      @current_user = User.find(decoded['user_id'])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      nil
    end
  end
end

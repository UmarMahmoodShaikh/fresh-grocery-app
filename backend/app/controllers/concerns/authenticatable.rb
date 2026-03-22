module Authenticatable
  extend ActiveSupport::Concern

  private

  # Decodes JWT from Authorization header and sets @current_user.
  # Returns 401 if token is missing, invalid, or expired.
  def authenticate_user!
    token = extract_token
    return render_unauthorized("Token is missing") unless token

    begin
      payload = JWT.decode(
        token,
        Rails.application.secret_key_base,
        true,
        { algorithm: "HS256" }
      )[0]
      @current_user = User.find(payload["user_id"])
    rescue JWT::ExpiredSignature
      render json: { error: "Token has expired. Please log in again." }, status: :unauthorized
    rescue JWT::DecodeError
      render_unauthorized("Invalid token")
    rescue ActiveRecord::RecordNotFound
      render_unauthorized("User not found")
    end
  end

  # Soft auth — sets @current_user if token is valid, silently ignores otherwise.
  # Use on endpoints that work for both authenticated and unauthenticated users.
  def try_authenticate_user!
    token = extract_token
    return unless token

    begin
      payload = JWT.decode(
        token,
        Rails.application.secret_key_base,
        true,
        { algorithm: "HS256" }
      )[0]
      @current_user = User.find(payload["user_id"])
    rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound
      nil
    end
  end

  # Renders 403 unless current_user is an admin.
  def require_admin!
    return if current_user&.admin?
    render json: { error: "Forbidden: admin access required" }, status: :forbidden
  end

  # Encodes a JWT with 24-hour expiry.
  def encode_token(payload)
    JWT.encode(
      payload.merge(
        exp: 24.hours.from_now.to_i,
        iat: Time.now.to_i
      ),
      Rails.application.secret_key_base,
      "HS256"
    )
  end

  def current_user
    @current_user
  end

  private

  def extract_token
    request.headers["Authorization"]&.split(" ")&.last
  end

  def render_unauthorized(message = "Unauthorized")
    render json: { error: message }, status: :unauthorized
  end
end

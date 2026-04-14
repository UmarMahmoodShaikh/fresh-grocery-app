class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session

  before_action :force_v1_upgrade

  private

  def force_v1_upgrade
    if request.path.start_with?('/api/v1')
      # Bypassing for Activeadmin/frontend if any, though they shouldn't be under /api/v1
      render json: { error: "Upgrade your app" }, status: :upgrade_required
    end
  end
end

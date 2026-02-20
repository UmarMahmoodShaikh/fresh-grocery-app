class FrontendController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:index]

  def index
    render file: Rails.root.join('public', 'index.html')
  end
end

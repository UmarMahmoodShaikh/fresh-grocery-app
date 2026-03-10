class FrontendController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:index]

  def index
    index_file = Rails.root.join('public', 'index.html')
    if File.exist?(index_file)
      render file: index_file
    else
      render json: { 
        message: "Welcome to GroceryGo", 
        version: "1.0.0",
        status: "Running"
      }
    end
  end
end

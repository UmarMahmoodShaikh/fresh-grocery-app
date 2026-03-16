Rails.application.routes.draw do
  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)
  mount Rswag::Ui::Engine => '/api-docs'
  mount Rswag::Api::Engine => '/api-docs'
  
  devise_for :users
  
  # API Routes
  namespace :api do
    namespace :v1 do
      resources :products
      resources :categories, only: [:index, :show]
      resources :brands, only: [:index, :show]
      resources :orders do
        member do
          patch :update_status
        end
      end
      resources :users, only: [:index, :show, :update, :destroy]
      resources :addresses do
        member do
          patch :set_default
        end
      end
      resources :invoices
      get 'reports', to: 'reports#index'
      
      post 'auth/login', to: 'auth#login'
      post 'auth/signup', to: 'auth#signup'
      post 'auth/check-email', to: 'auth#check_email'
      get 'auth/me', to: 'auth#me'
      
      # Admin dashboard endpoints
      get 'admin/dashboard/summary', to: 'admin#summary'
      get 'admin/dashboard/orders', to: 'admin#orders'

      # PayPal payment routes (JWT required — enforced in PaypalController)
      post 'paypal/create-order',  to: 'paypal#create_order'
      post 'paypal/capture-order', to: 'paypal#capture_order'
    end
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # Serve the React Frontend
  root "frontend#index"
  get '*path', to: 'frontend#index', constraints: ->(req) { !req.xhr? && req.format.html? }
end

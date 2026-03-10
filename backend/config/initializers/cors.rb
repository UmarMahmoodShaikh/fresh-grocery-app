# Be sure to restart your server when you modify this file.
# Avoid CORS issues when API is called from the frontend app.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # In production, restrict to known origins. In development, allow all (for Expo Go / emulators).
    origins Rails.env.production? \
              ? [ ENV.fetch("FRONTEND_URL", "https://fresh-grocery-store-74f6cf859e50.herokuapp.com"),
                  "http://localhost:8081",   # Expo Metro Dev
                  "http://localhost:5173" ]  # Vite admin dev
              : "*"

    resource "/api/*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      expose:  [ "Authorization" ],         # let clients read the auth header
      max_age: 600
  end

  # Allow ActiveAdmin UI in development
  allow do
    origins "http://localhost:3000", "http://localhost:5001"
    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ]
  end
end

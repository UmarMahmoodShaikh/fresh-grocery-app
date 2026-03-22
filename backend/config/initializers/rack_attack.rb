# config/initializers/rack_attack.rb
# Rate limiting to protect against brute-force and abuse.

class Rack::Attack
  # Throttle login attempts per IP: 5 per minute
  throttle("login/ip", limit: 5, period: 1.minute) do |req|
    req.ip if req.path == "/api/v1/auth/login" && req.post?
  end

  # Throttle signup per IP: 10 per hour (prevent mass account creation)
  throttle("signup/ip", limit: 10, period: 1.hour) do |req|
    req.ip if req.path == "/api/v1/auth/signup" && req.post?
  end

  # Throttle general API calls per IP: 300 per minute
  throttle("api/ip", limit: 300, period: 1.minute) do |req|
    req.ip if req.path.start_with?("/api/")
  end

  # Return structured JSON when rate limit is hit
  self.throttled_responder = lambda do |env|
    [
      429,
      { "Content-Type" => "application/json" },
      [{ error: "Too many requests. Please slow down.", retry_after: "60s" }.to_json]
    ]
  end
end

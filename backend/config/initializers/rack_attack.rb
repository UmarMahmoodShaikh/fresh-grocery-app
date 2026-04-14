class Rack::Attack
  ### Configure Cache ###
  # Rack::Attack uses Rails.cache by default.
  # If you want to use a separate Redis for throttling:
  # self.cache.store = ActiveSupport::Cache::RedisCacheStore.new(url: ENV['REDIS_URL'])

  ### Throttle Spammy Clients ###

  # 1. General Rate Limit: 100 requests per 1 minute by IP
  throttle('req/ip', limit: 300, period: 5.minutes) do |req|
    req.ip
  end

  # 2. Login Throttling (Protection against Brute Force)
  # Limit login attempts to 5 per minute per IP
  throttle('login/ip', limit: 5, period: 1.minute) do |req|
    if req.path == '/api/v1/auth/login' && req.post?
      req.ip
    end
  end

  # 3. Order Throttling (Preventing spam orders)
  # Limit order creation to 5 per hour per user/IP
  throttle('orders/ip', limit: 10, period: 1.hour) do |req|
    if req.path.include?('/orders') && req.post?
      req.ip
    end
  end

  # 4. Search Throttling (Prevent scraping)
  throttle('search/ip', limit: 30, period: 1.minute) do |req|
    if req.path.include?('/search') || req.path.include?('/products')
      req.ip
    end
  end

  ### Block Common Bot Scanners ###
  blocklist('block bad bots') do |req|
    # Block requests from known bad User-Agents (example)
    ['python-requests', 'curl', 'wget'].include?(req.user_agent)
  end

  ### Custom Response ###
  self.throttled_responder = lambda do |env|
    [ 429,  # status
      { 'Content-Type' => 'application/json' }, # headers
      [{ error: "Rate limit exceeded. Try again in a few minutes." }.to_json] # body
    ]
  end
end

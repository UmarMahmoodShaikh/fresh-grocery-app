# config/initializers/redis.rb
REDIS_URL = ENV.fetch("REDIS_URL", "redis://localhost:6379/0")

REDIS = Redis.new(url: REDIS_URL)

# Test connection on boot (non-fatal in development)
begin
  REDIS.ping
  Rails.logger.info "✅ Redis connected at #{REDIS_URL}"
rescue Redis::CannotConnectError => e
  Rails.logger.warn "⚠️  Redis not available: #{e.message}. Caching will fall back to memory store."
end

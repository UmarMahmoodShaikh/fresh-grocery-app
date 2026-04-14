require 'redis'

# Global Redis connection pool for the entire application
# Use $redis.with { |conn| conn.get("key") } for maximum thread safety
# or just $redis.get("key") for simple usage
$redis = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))

# Check connection on boot
begin
  $redis.ping
  Rails.logger.info "✅ Redis connection established successfully"
rescue => e
  Rails.logger.error "❌ Redis connection failed: #{e.message}"
end

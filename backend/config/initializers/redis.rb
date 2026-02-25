# config/initializers/redis.rb
REDIS_URL = ENV["REDIS_URL"] || ENV["REDISCLOUD_URL"] || ENV["REDISTOGO_URL"] || "redis://localhost:6379/0"

REDIS = Redis.new(url: REDIS_URL)

# Test connection on boot (quiet during asset precompilation)
unless ENV['RAILS_ASSETS_PRECOMPILE'] || (defined?(Rake) && Rake.application.top_level_tasks.include?('assets:precompile'))
  begin
    REDIS.ping
    Rails.logger.info "✅ Redis connected at #{REDIS_URL}"
  rescue Redis::CannotConnectError => e
    # Only warn if we actually expected a real Redis URL (i.e. not defaulting to localhost in production)
    if Rails.env.production? && ENV["REDIS_URL"].blank?
      Rails.logger.warn "⚠️  REDIS_URL is missing in production! System will be slow."
    elsif !ENV['RAILS_ASSETS_PRECOMPILE']
      Rails.logger.warn "⚠️  Redis not available at #{REDIS_URL}. Caching will fall back to memory store."
    end
  end
end

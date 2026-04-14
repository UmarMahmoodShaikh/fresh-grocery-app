Sentry.init do |config|
  config.dsn = ENV['SENTRY_DSN']
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]

  # Set traces_sample_rate to 1.0 to capture 100%
  # of transactions for performance monitoring.
  # We recommend adjusting this value in production.
  config.traces_sample_rate = 1.0
  
  # Only enable Sentry for production or if the DSN is present
  # For testing purposes, we enable it in development too
  config.enabled_environments = %w[production staging development]
  
  # Filter out sensitive parameters from logs
  config.send_default_pii = false
end

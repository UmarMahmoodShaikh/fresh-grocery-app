# config/initializers/lograge.rb
# Structured JSON logging for better searchability in production (Heroku, Datadog, etc.)

Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new

  config.lograge.custom_options = lambda do |event|
    {
      time:        Time.now.utc.iso8601,
      user_id:     event.payload[:user_id],
      request_id:  event.payload[:request_id],
      ip:          event.payload[:ip],
      exception:   event.payload[:exception]&.first,
    }.compact
  end

  # Append user_id and IP to log payload from controller
  config.lograge.custom_payload do |controller|
    {
      user_id:    controller.respond_to?(:current_user) ? controller.current_user&.id : nil,
      request_id: controller.request.request_id,
      ip:         controller.request.remote_ip,
    }.compact
  end
end

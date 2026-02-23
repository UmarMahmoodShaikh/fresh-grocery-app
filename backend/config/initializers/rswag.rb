Rswag::Api.configure do |c|
  c.openapi_root = Rails.root.to_s + '/swagger'
end

Rswag::Ui.configure do |c|
  c.openapi_endpoint '/api-docs/v1/swagger.yaml', 'API V1 Docs'
end

class ApplicationService
  def self.call(*args, &block)
    new(*args, &block).call
  end

  protected

  def success(payload = {})
    OpenStruct.new(success?: true, payload: payload, error: nil)
  end

  def failure(error_message, status = :unprocessable_entity)
    OpenStruct.new(success?: false, payload: nil, error: error_message, status: status)
  end
end

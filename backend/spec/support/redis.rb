RSpec.configure do |config|
  config.before(:each) do
    # Clear Redis database after each test to ensure isolation
    $redis.flushdb
  end

  config.after(:suite) do
    # Final cleanup
    $redis.flushdb
  end
end

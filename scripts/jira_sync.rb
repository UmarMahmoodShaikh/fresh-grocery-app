require 'net/http'
require 'uri'
require 'json'
require 'base64'

# --- Configuration ---
def get_env(key)
  File.readlines('.env').each do |line|
    if line.start_with?(key)
      return line.split('=')[1].strip
    end
  end rescue nil
end

JIRA_DOMAIN = get_env("JIRA_DOMAIN")
JIRA_PROJECT = get_env("JIRA_PROJECT")
JIRA_EMAIL = get_env("JIRA_EMAIL")
# Your specific Atlassian Account ID found via API
JIRA_ACCOUNT_ID = get_env("JIRA_ACCOUNT_ID")
JIRA_API_TOKEN = get_env("JIRA_SYNC_2026") || get_env("API_KEY")

if JIRA_EMAIL.nil? || JIRA_API_TOKEN.nil?
  puts "❌ Error: Missing JIRA_EMAIL or API_KEY in .env."
  exit 1
end

# --- The Master Backlog ---
TASKS = [
  {
    summary: "[Security] Implement JWT Authentication for Mobile API",
    description: "Move from session-based auth to JWT for the Mobile app. Secure the API/V1 endpoints using 'devise-jwt' or similar. Ensure tokens are stored safely on the device."
  },
  {
    summary: "[Security] Configure Rack::Attack for Rate Limiting",
    description: "Set up thresholds for sign_in and product search endpoints to prevent brute-force and scraping. Block IPs exceeding 100 requests per minute."
  },
  {
    summary: "[Backend] Build Product-Specific Promotion Engine",
    description: "Create 'PromotionItem' join table. Allow admins to select specific products for discounts. Update calculation logic to prioritize these over store-wide banners."
  },
  {
    summary: "[Backend] Implement PostGIS Store Geofencing",
    description: "Add a service to check if a user's address (latitude/longitude) falls within a store's 'boundary' (ST_Polygon). Use this to filter available stores in the UI."
  },
  {
    summary: "[Mobile] Integrate PayPal Checkout Flow",
    description: "Connect the frontend Cart state to the Node.js Payment Server. Handle the 'Create Order' and 'Capture Order' callbacks from PayPal within the app."
  },
  {
    summary: "[Mobile] Implement Animated UI with Reanimated 3",
    description: "Add micro-animations for 'Add to Cart', 'Heart Favorite', and smooth transitions between the home screen and product details."
  },
  {
    summary: "[Testing] RSpec Coverage for Core Models",
    description: "Achieve 80%+ test coverage for User, Order, Product, and Store models. Validate associations, scopes, and custom business logic."
  },
  {
    summary: "[Testing] UI Component Tests (Jest)",
    description: "Set up Jest and React Native Testing Library. Create snapshots and interaction tests for the Cart and Product Card components."
  },
  {
    summary: "[DevOps] Dockerize Backend & Payment Server",
    description: "Create Dockerfiles and a docker-compose.yml for local development and staging consistency. Include PostgreSQL and Redis as services."
  },
  {
    summary: "[DevOps] Setup GitHub Actions CI/CD",
    description: "Automate linting (Rubocop/ESLint) and testing on every pull request. Enable auto-deployment to staging for approved merges."
  },
  {
    summary: "[Search] Optimize Algolia Search Indexing",
    description: "Fine-tune the searchable attributes (name, brand, category). Set up custom ranking based on product popularity and stock availability."
  },
  {
    summary: "[Utility] Automated PDF Invoice Generation",
    description: "Implement a background job to generate a PDF invoice when an order is completed. Use 'WickedPDF' or similar and store in ActiveStorage."
  }
]

def create_issue(task)
  url = URI("https://#{JIRA_DOMAIN}/rest/api/3/issue")
  http = Net::HTTP.new(url.host, url.port)
  http.use_ssl = true

  request = Net::HTTP::Post.new(url)
  request["Accept"] = "application/json"
  request["Content-Type"] = "application/json"
  
  auth = Base64.strict_encode64("#{JIRA_EMAIL}:#{JIRA_API_TOKEN}")
  request["Authorization"] = "Basic #{auth}"

  payload = {
    fields: {
      project: { key: JIRA_PROJECT },
      summary: task[:summary],
      description: {
        type: "doc", version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: task[:description] }] }]
      },
      issuetype: { id: "10012" }, # Task ID for ZYNG
      reporter: { id: JIRA_ACCOUNT_ID }
    }
  }.to_json

  request.body = payload
  response = http.request(request)

  if response.code == "201"
    res_body = JSON.parse(response.body)
    puts "✅ Created: #{task[:summary]} (#{res_body['key']})"
  else
    puts "❌ Failed: #{task[:summary]} - #{response.code}"
    puts "   Detail: #{response.body}"
  end
end

puts "🚀 Pushing Full Backlog to project #{JIRA_PROJECT}..."
TASKS.each { |task| create_issue(task) }
puts "✨ Board Initialization Complete!"

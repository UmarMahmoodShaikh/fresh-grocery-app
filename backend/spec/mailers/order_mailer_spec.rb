require "rails_helper"

RSpec.describe OrderMailer, type: :mailer do
  let(:user) { User.create!(email: 'mailer_user@example.com', password: 'password') }
  let(:address) do
    Address.create!(
      user: user, label: :home, street: '1 Rue de la Paix', city: 'Paris',
      zip_code: '75001', country: 'France', latitude: 48.8566, longitude: 2.3522
    )
  end
  let(:order) { Order.create!(user: user, address: address, total: 75.50, status: :pending) }

  # ── order_created ─────────────────────────────────────────────────────────────

  describe '#order_created' do
    let(:mail) { OrderMailer.order_created(order) }

    it 'renders the subject' do
      expect(mail.subject).to eq("Order confirmed! ##{order.id} - Fresh Grocery")
    end

    it 'sends to the user\'s email' do
      expect(mail.to).to eq([user.email])
    end

    it 'sends from the configured address' do
      expect(mail.from).to eq(['umarmahmoodshk@gmail.com'])
    end
  end

  # ── order_shipped ─────────────────────────────────────────────────────────────

  describe '#order_shipped' do
    let(:mail) { OrderMailer.order_shipped(order) }

    it 'renders the shipped subject with order id' do
      expect(mail.subject).to eq("Your order ##{order.id} has shipped!")
    end

    it 'sends to the user\'s email' do
      expect(mail.to).to eq([user.email])
    end

    it 'sends from the configured address' do
      expect(mail.from).to eq(['umarmahmoodshk@gmail.com'])
    end
  end

  # ── order_delivered ───────────────────────────────────────────────────────────

  describe '#order_delivered' do
    let(:mail) { OrderMailer.order_delivered(order) }

    it 'renders the delivered subject with order id' do
      expect(mail.subject).to eq("Your order ##{order.id} has been delivered")
    end

    it 'sends to the user\'s email' do
      expect(mail.to).to eq([user.email])
    end

    it 'sends from the configured address' do
      expect(mail.from).to eq(['umarmahmoodshk@gmail.com'])
    end
  end
end

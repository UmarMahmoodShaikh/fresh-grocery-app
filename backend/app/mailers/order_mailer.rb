class OrderMailer < ApplicationMailer
  default from: 'umarmahmoodshk@gmail.com'

  def order_created(order)
    @order = order
    @user = order.user
    mail(to: @user.email, subject: "Order confirmed! ##{@order.id} - Fresh Grocery")
  end

  def test_email(to_email)
    mail(to: to_email, subject: "Fresh Grocery - Email Test")
  end

  def order_shipped(order)
    @order = order
    @user = order.user
    mail(to: @user.email, subject: "Your order ##{@order.id} has shipped!")
  end

  def order_delivered(order)
    @order = order
    @user = order.user
    mail(to: @user.email, subject: "Your order ##{@order.id} has been delivered")
  end
end

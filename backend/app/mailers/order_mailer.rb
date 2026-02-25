class OrderMailer < ApplicationMailer
  default from: 'no-reply@trinity.com'

  def order_created(order)
    @order = order
    @user = order.user
    mail(to: @user.email, subject: "Order confirmation - ##{@order.id}")
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

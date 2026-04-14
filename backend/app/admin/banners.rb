ActiveAdmin.register Banner do
  menu priority: 5

  permit_params :store_id, :image_url, :link_url, :image

  scope_to :current_admin_user, association_method: :banners, unless: proc { current_admin_user.super_admin? && current_admin_user.store_id.nil? }

  index do
    selectable_column
    id_column
    column :store if current_admin_user.super_admin? && current_admin_user.store_id.nil?
    column :image do |banner|
      if banner.image.attached?
        image_tag url_for(banner.image), height: '50'
      elsif banner.image_url.present?
        image_tag banner.image_url, height: '50'
      end
    end
    column :link_url
    actions
  end

  form do |f|
    f.inputs do
      f.input :store if current_admin_user.super_admin? && current_admin_user.store_id.nil?
      f.input :store_id, as: :hidden, input_html: { value: current_admin_user.store_id } if current_admin_user.store_id.present?
      
      f.input :image, as: :file, hint: (f.object.image.attached? && f.object.image.persisted?) ? image_tag(url_for(f.object.image), height: '100') : "No image"
      f.input :image_url, label: "External Image URL"
      f.input :link_url
    end
    f.actions
  end
end

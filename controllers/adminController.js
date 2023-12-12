const Product = require("../models/product");
const Category = require("../models/category");
const User = require("../models/user");
const fs = require("fs");
const Order = require("../models/order");

module.exports = {
  //Admin Dashboard
  adminDashboard: (req, res) => {
    res.render("admin/dashboard", { tittle: "GadgetStore | Dashboard" });
  },

  //Admin products
  adminProducts: async (req, res, next) => {
    try {
      let products = await Product.find().lean();
      let categorys = await Category.find().lean();
      res.render("admin/products", {
        tittle: "GadgetStore | Admin products",
        message: req.flash(),
        products,
        categorys,
      });
    } catch (error) {}
  },

  adminProductDetails: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let product = await Product.findById(productId).populate("category");

      res.render("admin/product-details", {
        tittle: "GadgetStore | Product Details",
        product,
      });
    } catch (error) {
      next(error);
    }
  },

  productList: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let isListed = true;
      await Product.findOneAndUpdate({ _id: productId }, { isListed });
      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  productUnlist: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let isListed = false;
      await Product.findOneAndUpdate({ _id: productId }, { isListed });
      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  addProductsPage: async (req, res, next) => {
    try {
      let categorys = await Category.find().lean();
      res.render("admin/add-products", {
        tittle: "GadgetStore | Admin Add product",
        categorys: categorys,
      });
    } catch (error) {
      next(error);
    }
  },

  addProduct: async (req, res, next) => {
    try {
        let { productName, price, brand, category, specification, description, stock } = req.body;
     
      //product images
      let images = req.files;
      let imagesPaths = [];
      let basePath = `/uploads/`;
      if (!images) {
        throw new Error("no image in the request");
      }
      
      //push the images paths to array
      images.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });

      let product = await Product.create({
        productName,
        price,
        category,
        brand,
        description,
        images: imagesPaths,
        stock,
        specification
      });

      if (!product) {
        req.flash("error", "The product cannot be created");
      } else {
        req.flash("message", "product add was successful");
      }

      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  editProductPage: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let product = await Product.findOne({ _id: productId }).populate(
        "category"
      );
      let categorys = await Category.find().lean();
      res.render("admin/edit-product", {
        tittle: "GadgetStore | Admin edit Product",
        product,
        categorys,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteOldImage: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let imageIndex = req.params.index;
      let product = await Product.findOne({ _id: productId });
      let image = product.images[imageIndex];
      // delete the image in the upload folder
      fs.unlinkSync(`public${image}`);

      //delete the image in db
      await Product.findOneAndUpdate(
        { _id: productId },
        { $pull: { images: image } }
      );
      res.json("done");
    } catch (error) {
      next(error);
    }
  },

  cropImage: async (req, res, next) => {
    try {
      let image = req.file;
      let imageIndex = req.params.index;
      let productId = req.params.product_id
      let product = await Product.findOne({ _id: productId });
      let productImage = product.images[imageIndex];

      let updateQuery = {
        $set: {
          [`images.${imageIndex}`]: `/uploads/${image.filename }`
        }
      };
      
      await Product.findOneAndUpdate({ _id: productId }, updateQuery);

      //delete the image from server
      fs.unlink(`public${productImage}`, (err, data) => {
        if (err) {
          console.log(err);
        }
      });
      req.flash('message', 'image cropped');
      res.json("sucsses");
    } catch (error) {
      next(error)
    }
  },

  editProduct: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let {
        productName,
        price,
        brand,
        category,
        description,
        stock,
        specification,
      } = req.body;
      //product images
      let newImages = req.files;
      let imagesPaths = [];
      let basePath = `/uploads/`;

      let updateFields = {
        productName,
        price,
        brand,
        category,
        description,
        stock,
        specification,
      };

      // Process new images
      if (newImages) {
        newImages.map((file) => {
          imagesPaths.push(`${basePath}${file.filename}`);
        });
        updateFields.$push = { images: { $each: imagesPaths } };
      }

      let product = await Product.findOneAndUpdate(
        { _id: productId },
        updateFields,
        { new: true }
      );
      if (!product) {
        req.flash("error", "Failed to update product. Please try again.");
      } else {
        req.flash("message", "Product updated successfully.");
      }

      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  deleteProduct: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let product = await Product.findOneAndDelete({ _id: productId });
      let images = product.images;

      //delete the product images
      images.forEach((image) => {
        fs.unlinkSync(`public${image}`);
      });

      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  productSearch: async (req, res, next) => {
    try {
      let productName = req.query.productName;

      const regex = new RegExp(productName, "i");

      let products = await Product.find({
        productName: regex,
      }).lean();

      let categorys = await Category.find().lean();

      if (!products) {
        req.flash("message", "No products found");
      }

      res.render("admin/products", {
        tittle: "GadgetStore | Admin products",
        message: req.flash(),
        products,
        categorys,
      });
    } catch (error) {
      next(error);
    }
  },

  //admin users
  adminUsers: async (req, res, next) => {
    try {
      let allUsers = await User.find().lean();
      res.render("admin/users", {
        tittle: "GadgetStore | Admin Users",
        users: allUsers,
      });
    } catch (error) {
      next(error);
    }
  },

  adminUserdetails: async (req, res) => {
    try {
      let userId = req.params.user_id;
      let user = await User.findOne({ _id: userId });
      res.render("admin/user-details", {
        tittle: "GadgetStore | Admin User",
        user,
      });
    } catch (error) {}
  },

  adminUserBlock: async (req, res, next) => {
    try {
      let userId = req.params.user_id;
      let status = "blocked";
      await User.updateOne({ _id: userId }, { accountStatus: status });
      res.redirect(`/admin/user/${userId}/view`);
    } catch (error) {
      next(error);
    }
  },

  adminUserUnblock: async (req, res, next) => {
    try {
      let userId = req.params.user_id;
      let status = "unverified";
      await User.updateOne({ _id: userId }, { accountStatus: status });
      res.redirect(`/admin/user/${userId}/view`);
    } catch (error) {
      next(error);
    }
  },

  adminCategory: async (req, res, next) => {
    try {
      let categorys = await Category.find();
      res.render("admin/category", {
        tittle: "GadgetStore | Admin Category",
        categorys,
        message:req.flash()
      });
    } catch (error) {
      next(error);
    }
  },

  addCategory: async (req, res, next) => {
    try {
      let categoryName = new RegExp(req.body.categoryName,'i');
      let iscategory = await Category.findOne({ categoryName: categoryName });

      //check if category already exists
      if (iscategory) {
        req.flash('error', 'Category already exists');
        return res.redirect('/admin/category');
      }

      await Category.create({ categoryName });
      req.flash('message', 'Category Created');
      res.redirect('/admin/category');
    } catch (error) {
      next(error);
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      let categoryId = req.params.id;
      await Category.deleteOne({ _id: categoryId });
      res.redirect("/admin");
    } catch (error) {
      next(error);
    }
  },

  adminOrdersPage: async (req, res, next) => {
    try {
      let orders = await Order.find().populate('user_id').lean();
      res.render('admin/orders', {
        tittle: 'GadgetStore | Admin Orders',
        orders
      });
    } catch (error) {
      next(error);
    }
  },

  adminOrderDetails: async (req, res, next) => {
    try {
      let orderId = req.params.order_id;
      let order = await Order.findOne({ _id: orderId })
        .populate('user_id')
        .populate('orderAddress')
        .populate('items.product')
      res.render('admin/order-details', {
        tittle: 'GadgetStore | Order Details',
        order
      })
    } catch (error) {
      next(error);
    }
  },

  adminOrderStatus: async (req, res, next) => {
    try {
      let orderId = req.params.order_id;
      let status = req.body;
      let order = await Order.findOneAndUpdate({ _id: orderId }, { $set: { orderStatus: status.orderStatus } });
      
      res.json('done');
    } catch (error) {
      next(error);
    }
  }
};
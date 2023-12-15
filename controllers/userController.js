const User = require('../models/user');
const Product = require('../models/product');
const Category = require('../models/category');
const Address = require('../models/address');
const Cart = require('../models/cart');
const productReview = require('../models/productReview');
const Order = require('../models/order');

module.exports = {
  
  userHomePage: async (req, res, next) => {
    try {
      let newProducts = await Product.find({ isListed: true }).limit(4).lean();
      let products = await Product.find({ isListed: true }).populate('category').lean();
      let user = req.user;
      res.render('shop/home', {
        tittle: 'GadgetStore | Home',
        newProducts,
        products,
        user
      });

    } catch (error) {
      next(error);
    };
  },

  userProductsPage: async (req, res, next) => {
    try {
      
      let productName = req.query.productName || "";
      let filterPrice = req.query.priceFilter || 1000000
      let filterCategory = req.query.category || 'All'
      const regex = new RegExp(productName, "i");

      //pagination
      let page = req.query.page || 1;
      let limit = 9;
      let skip = (page - 1) * limit;
      let endIndex = page * limit;
      let products = await Product.find({ $and: [{ productName: regex }, { price: { $lte: filterPrice } }, { isListed: true }] })
        .skip(skip).limit(endIndex).populate('category');

      let filteredProducts = products
      if (filterCategory != 'All') {
        let categoryProduct = [];
        products.forEach(product => {
          if (product.category.categoryName == filterCategory) {
            categoryProduct.push(product)
          }
        })
        filteredProducts = categoryProduct;
      } 
    
      
      let categorys = await Category.find().lean();
      let user = req.user;

      res.render('shop/product-list', {
        tittle: 'GadgetStore | Products',
        message:req.flash(),
        filteredProducts,
        filterCategory,
        filterPrice,
        categorys,
        user
      });

    } catch (error) {
      next(error);
    }
  },

  productSearch: async (req, res, next) => {
    try {
      let productName = req.query.productName;
      console.log(req.query);
      const regex = new RegExp(productName, "i");

      let products = await Product.find({
        $and: [
          { productName: regex },
          { isListed: true }
        ]
      }).lean()
            
      let categorys = await Category.find().lean();

          if (products.length===0) {
              req.flash('error', 'No products found');
      };
      
      res.render('user/product-list', {
        tittle: 'GadgetStore | Products',
        message: req.flash(),
        products,
        categorys,
        user
      });

    } catch (error) {
      
    }
  },
//products details page
  productDetails: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let product = await Product.findById(productId).populate('category');
      let productReviews = await productReview.findOne({ product_id: product._id });
      let user = req.user;

      res.render('shop/product-details', {
        tittle: 'GadgetStore | Product Details',
        product,
        productReviews,
        user
      });
    } catch (error) {
      next(error);
    }
  },

  productReview: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let username = req.user.username;
      let reviewText = req.body.review;
      let reviewDate = new Date()
      let user = req.user;

      let newReview = {
        username,
        reviewDate,
        review:reviewText
      }

      let review = await productReview.findOne({ product_id: productId });

      if (!review) {
        await productReview.create({
          product_id: productId,
          productReview: [newReview]
        })
      } else {
        await productReview.updateOne({ _id: review._id }, { $push: { productReview: newReview } });
      }
      
      res.redirect(`/product/${productId}/view`);
      

    } catch (error) {
      next(error)
    }
  },

//user Profile
  userProfile:async (req, res) => {
    try {
      let user = req.user;
      let userAddress = await Address.find({ user_id: user._id });
      let userOrders = await Order.find({ user_id: user._id });
      res.render('user/profile', {
        tittle: 'GadgetStore | Profile',
        user,
        userAddress,
        userOrders,
        message: req.flash(),
      });
    } catch (error) {
      next(error)
    }
  },

  userProfileEdit: async (req, res, next) => {
    try {
      let user = req.user;
      res.render('user/edit-profile', {
        tittle: 'GadgetStore | Profile',
        user,
      });
    } catch (error) {
      next(error)
    }
  },

  userLogout: (req, res, next) => {
    //passport logout
    req.logout((err) => {
      if (err) { return next(err); }
      res.redirect('/');
    });
  },

  addAddressPage: (req, res) => {
    let user = req.user;
    res.render('user/new-address', {
      tittle: 'GagetStore | New Address',
      user
    })
  },

  addAddress: async (req, res, next) => {
    try {
      let userId = req.params.user_id;
      let { houseName, town, address, city, state, pincode, addressType } = req.body;
      
      let newAddress = await Address.create({
        user_id:userId,
        houseName,
        town,
        address,
        city,
        state,
        pincode,
        addressType
      });

      if (!newAddress) {
        req.flash('error', 'something wrong, Address not created');
        return res.redirect('/profile');
      }

      req.flash('message', 'New Address created');
      res.redirect('/profile');

    } catch (error) {
      next(error);
    }
  },

  editAddressPage: async (req, res,next) => {
    try {
      let user = req.user;
      let addressId = req.params.address_id;
      let address = await Address.findOne({ _id: addressId });
      res.render('user/edit-address.ejs', {
        tittle: 'GagetStore | Edit Address',
        user,
        address
      })
    } catch (error) {
      next(error);
    }
  },

  editAddress: async (req, res, next) => {
    try {
      let addressId = req.params.address_id;
      let { houseName, town, address, city, state, pincode, addressType } = req.body;
      let updateFields = {
        houseName,
        town,
        address,
        city,
        state,
        pincode,
        addressType
      };

      let newAddress = await Address.findOneAndUpdate({ _id: addressId }, updateFields, { new: true });
      if (!newAddress) {
        req.flash('error', 'something wrong, Address not updated');
        return res.redirect('/profile');
      }
      req.flash('message', 'New Address updated');
      res.redirect('/profile');

    } catch (error) {
      next(error);
    }
  },
  
  deleteAddress: async (req, res, next) => {
    try {
      let user = req.user;
      let addressId = req.params.address_id;
      
      let response = await Address.deleteOne({ _id: addressId });
      if (response) {
        req.flash('message','Address deleted')
        return res.redirect('/profile');
      }
      req.flash('error', 'Address not deleted');
      res.redirect('/profile');
    } catch (error) {
      next(error);
    }
  },

  userCartPage: async (req, res, next) => {
    try {
      let user = req.user;
      let userCart = await Cart.findOne({ user_id: user._id }).populate('items.product');
      let totalPrice = 0;
      if (userCart) {
        userCart.items.forEach(item => {
          totalPrice += item.product.price * item.quantity;
        });
      }
      res.render('user/user-cart', {
        tittle: 'GadgetStore | Cart',
        message: req.flash(),
        user,
        userCart,
        totalPrice
      });
    } catch (error) {
      next(error);
    }
  },

  addToCart: async (req, res, next) => {
    try {
      let user = req.user;    
      let productId = req.params.product_id;
      let itemQuantity = req.body.quantity || 1;
      let productQuantity = Number(itemQuantity);

      let items = {
        product: productId,
        quantity:productQuantity
      };

      let product = await Product.findOne({ _id: productId });
      //checking the stock of the product
      if (product.stock <= 0 || productQuantity > product.stock) {
        req.flash('error', 'out of stock')
        return res.redirect('/');
      }
      let userCart = await Cart.findOne({ user_id: user._id }).populate('items.product');

      //removing the stock from the product data
      let leftStock = product.stock-productQuantity
      await Product.updateOne({ _id: productId }, { $set: { stock: leftStock } });

      if (!userCart) {
        console.log(userCart);
        await Cart.create({
          user_id:user._id,
          items
        }); 
        console.log('sdf')
        req.flash('message', 'product added to Cart');
        return res.redirect('/cart');
      }

      
     //checks if item already exist in cart
      let existItem;
      userCart.items.forEach((item) => {
        if (item.product._id.toString() === productId) {
          existItem = item;
        }
      });

      if (!existItem) {
        await Cart.updateOne({ _id: userCart._id }, { $push: { items } });
      } else {
        let quantity = productQuantity + existItem.quantity;  
        await Cart.updateOne({ _id: userCart._id, "items.product": productId }, { $set: { "items.$.quantity":quantity } });
      }

      res.redirect('/');

    } catch (error) {
      next(error);
    }
  },

  cartItemChangeQuantity: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let user = req.user;
      let cartQuantity = req.body;
      let product = await Product.findOne({ _id: productId });
      let userCart = await Cart.findOne({ user_id: user._id });
      let currentQuantity 
      let productStock = product.stock;

      userCart.items.forEach(item => {
        if (productId === item.product.toString()) {
          currentQuantity = item.quantity
        }
      });

      if (cartQuantity.change === 1) {
        if (productStock === 0) {
          return req.flash('error', 'Out of Stock');
        }
        currentQuantity++;
        productStock--;
      }
      if (cartQuantity.change === -1 && currentQuantity >= 1) {
        currentQuantity--;
        productStock++;
      }
      await Cart.updateOne({ _id: userCart._id, "items.product": productId }, { $set: { "items.$.quantity": currentQuantity } });
      await Product.updateOne({ _id: productId }, { $set: { stock: productStock } });
      res.json('success');

    } catch (error) {
      next(error);
    }
  },

  cartItemDelete: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let user = req.user;
      let userCart = await Cart.findOne({ user_id: user._id }).populate('items.product');
      let product = await Product.findOne({ _id: productId });
      let productQuantity = 0
      //checking the product quantity
      userCart.items.forEach((item) => {
        if (item.product._id.toString() === productId) {
          productQuantity = item.quantity;
        }
      });
      
      //updating stock of removed product
      let currentStock = productQuantity + product.stock;
      
      await Cart.updateOne({ user_id: user._id }, { $pull: { items: { product: productId } } });
      await Product.updateOne({ _id: productId, }, { $set: { stock: currentStock } });
      
      res.json('success');
    } catch (error) {
      next(error);
    }
  },

  cartCheckoutPage: async (req, res, next) => {
    try {
      let cartId = req.params.cart_id;
      let user = req.user;
      let userCart = await Cart.findOne({ _id: cartId }).populate('items.product');
      let userAddress = await Address.find({ user_id: user._id });
      let totalPrice = 0;
      let quantityCheck = false;
      //calculating total price of the product
      userCart.items.forEach(item => {
        if (item.quantity < 1) {
          quantityCheck = true;
        }
        totalPrice += item.product.price * item.quantity;
      });
      if (quantityCheck) {
        req.flash('error', 'zero quantity on product');
        return res.redirect('/cart');
      }
      res.render('user/checkout', {
        tittle: 'GadgetStore | Checkout',
        userAddress,
        userCart,
        user,
        totalPrice 
      })
    } catch (error) {
      next(error);
    }
  },

  orderPage: async (req, res, next) => {
    try {
      let user = req.user;
      let orderId = req.params.order_id;
      let userOrder = await Order.findOne({ _id: orderId }).populate('items.product').populate('orderAddress');
      res.render('user/order', {
        tittle: 'GadgetStore | Order',
        user,
        userOrder,
      })
    } catch (error) {
      next(error);
    }
  },

  createOrder: async (req, res, next) => {
  try {
    let user = req.user;
    let userCartId = req.params.cart_id;
    let { addressId, paymentMethod } = req.body;
    let userCart = await Cart.findOne({ _id: userCartId }).populate('items.product');
    let orderItems = userCart.items;
    let orderStatus = 'Processing';
    let totalPrice = 0

    //calculating total price
    userCart.items.forEach(item => {
      totalPrice += item.product.price * item.quantity;
    });

    let order = await Order.create({
      user_id: user._id,
      orderAddress: addressId,
      items:orderItems,
      paymentMethod,
      orderStatus,
      totalPrice
    })

    if (!order) {
      req.flash('error', 'order not created');
      return res.redirect('/cart');
    }
    await Cart.deleteOne({ _id: userCart._id });
    req.flash('message', 'Order created');
    res.redirect(`/order/${order._id}`)
    
  } catch (error) {
    next(error)
  }
  },

  cancelOrder: async (req, res, next) => {
    try {
      let orderId = req.params.order_id;
      let order = await Order.findOneAndDelete({ _id: orderId });

      // adding the cancelled items stock to product db
      order.items.forEach(async (item) => {
        let product = await Product.findOne({ _id: item.product });
        let currentStock = product.stock + item.quantity;
        await Product.updateOne({ _id: item.product }, { $set: { stock: currentStock } });
      })
      res.redirect('/')
    } catch (error) {
      next(error);
    }
  }
}

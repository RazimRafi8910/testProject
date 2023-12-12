const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticateUser, isAuthenticated, isUserBlocked } = require('../middleware/authMiddleware');
const router = express();

//Authentication routes
router.get('/signup',isAuthenticated, authController.signupPage);
router.post('/signup', authController.userSignup);
router.get('/verification', authController.otpVerificationPage);
router.get('/verification/resend', authController.otpResent);
router.post('/verification', authController.otpVerification);
router.get('/user/login',isAuthenticated, authController.loginPage);
router.post('/user/login', authController.userPassportLogin);

//Homepage route
router.get('/',isUserBlocked, userController.userHomePage);

//products
router.get('/products',isUserBlocked, userController.userProductsPage);
router.get('/product/:product_id/view',isUserBlocked, userController.productDetails);
router.get('/products/search', userController.productSearch);
router.post('/product/:product_id/review',authenticateUser, userController.productReview);

//user cart
router.get('/cart',isUserBlocked, authenticateUser, userController.userCartPage);
router.get('/cart/:cart_id/checkout', authenticateUser, userController.cartCheckoutPage);
router.post('/cart/:product_id/add', authenticateUser,userController.addToCart);
router.delete('/cart/:product_id/delete', authenticateUser, userController.cartItemDelete);

//order
router.get('/order/:order_id', authenticateUser, userController.orderPage);
router.post('/order/:cart_id/create', authenticateUser, userController.createOrder);

//profile
router.get('/profile',isUserBlocked, authenticateUser, userController.userProfile);
router.get('/address/:user_id/add',isUserBlocked, authenticateUser,userController.addAddressPage);
router.get('/address/:address_id/edit',isUserBlocked, authenticateUser,userController.editAddressPage);
router.post('/address/:address_id/edit', authenticateUser, userController.editAddress);
router.delete('/address/:address_id/delete', authenticateUser, userController.deleteAddress);
router.post('/address/:user_id/add', authenticateUser,userController.addAddress);
router.get('/logout',authenticateUser, userController.userLogout);

module.exports = router;


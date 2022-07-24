const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  singleProduct,
  createProductReview,
  getSingleProductReviews,
  deleteReview,
} = require("../controller/ProductController");
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.route('/products').get(getAllProducts);
router.route('/product/new').post(isAuthenticatedUser,authorizeRoles('admin'),createProduct);
router
  .route("/product/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct);
router
  .route("/product/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct)
  .get(singleProduct);

router.route("/product/review").post(isAuthenticatedUser, createProductReview);
router
  .route("/reviews")
  .get(getSingleProductReviews)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteReview);

module.exports = router;